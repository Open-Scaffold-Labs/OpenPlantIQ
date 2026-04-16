'use strict';
const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const csvParse = require('csv-parse/sync');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { query } = require('../db');

// Configure multer for file uploads (10MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv',
      'application/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/pdf',
    ];
    // Also allow by extension since MIME types can be unreliable
    const ext = file.originalname.split('.').pop().toLowerCase();
    const allowedExt = ['xlsx', 'xls', 'csv', 'tsv', 'docx', 'pdf'];
    if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.originalname} (${file.mimetype})`));
    }
  },
});

// ── Extract text/rows from different file types ─────────────────

async function extractFromExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const rows = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    // Skip empty rows
    for (const row of data) {
      if (row.some(cell => String(cell).trim())) {
        rows.push(row.map(c => String(c).trim()));
      }
    }
  }
  return rows;
}

function extractFromCSV(buffer) {
  const text = buffer.toString('utf-8');
  // Detect delimiter
  const firstLine = text.split('\n')[0] || '';
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  const records = csvParse.parse(text, {
    delimiter,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    quote: false,
  });
  return records.map(row => row.map(c => String(c).trim()));
}

async function extractFromWord(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return textToRows(result.value);
}

async function extractFromPDF(buffer) {
  const data = await pdfParse(buffer);
  return textToRows(data.text);
}

// Convert raw text block to potential plant rows
function textToRows(text) {
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const rows = [];
  for (const line of lines) {
    // Split on tabs, pipes, or multiple spaces (common in docs/PDFs)
    const parts = line.split(/\t|\|/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 1) {
      rows.push(parts);
    }
  }
  return rows;
}

// ── Intelligent column detection ────────────────────────────────
// Looks at headers and data to figure out which columns are plant name, qty, size, etc.

function detectColumns(rows) {
  if (rows.length === 0) return { headerRow: -1, columns: {} };

  // Check if first row looks like a header
  const firstRow = rows[0].map(c => c.toLowerCase());
  const headerKeywords = {
    botanical: ['botanical', 'botanic', 'latin', 'species', 'scientific'],
    common: ['common', 'plant', 'name', 'variety', 'cultivar'],
    quantity: ['qty', 'quantity', 'count', 'number', '#', 'no.', 'num'],
    size: ['size', 'container', 'pot', 'cal', 'caliper', 'gallon', 'gal'],
    spacing: ['spacing', 'space', 'o.c.', 'on center', 'spread'],
    notes: ['notes', 'note', 'remarks', 'comment', 'description'],
  };

  const columns = {};
  let headerRow = -1;

  // Try to match headers
  for (let i = 0; i < Math.min(3, rows.length); i++) {
    const row = rows[i].map(c => c.toLowerCase());
    let matches = 0;
    const tempCols = {};

    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      for (const [field, keywords] of Object.entries(headerKeywords)) {
        if (keywords.some(k => cell.includes(k)) && !tempCols[field]) {
          tempCols[field] = j;
          matches++;
          break;
        }
      }
    }

    if (matches >= 1) {
      headerRow = i;
      Object.assign(columns, tempCols);
      break;
    }
  }

  // If no header found, assume first column is plant name
  if (headerRow === -1) {
    // Check if first column looks like botanical names (contains genus + species pattern)
    const sampleCells = rows.slice(0, 5).map(r => r[0] || '');
    const looksLatin = sampleCells.filter(c => /^[A-Z][a-z]+ [a-z]/.test(c)).length;
    if (looksLatin >= 2) {
      columns.botanical = 0;
      if (rows[0].length > 1) columns.common = 1;
    } else {
      columns.common = 0;
      if (rows[0].length > 1) {
        // Check if second col is botanical
        const secondCells = rows.slice(0, 5).map(r => r[1] || '');
        const secondLatin = secondCells.filter(c => /^[A-Z][a-z]+ [a-z]/.test(c)).length;
        if (secondLatin >= 2) columns.botanical = 1;
      }
    }
    // Look for a quantity column (numeric values)
    for (let j = 0; j < (rows[0]?.length || 0); j++) {
      if (columns.botanical === j || columns.common === j) continue;
      const numericCount = rows.slice(0, 10).filter(r => /^\d+$/.test((r[j] || '').trim())).length;
      if (numericCount >= 3) {
        columns.quantity = j;
        break;
      }
    }
  }

  return { headerRow, columns };
}

// ── Fuzzy match plant names against our database ────────────────

async function matchPlants(extractedItems) {
  // Get all plants from database
  const { rows: allPlants } = await query(
    'SELECT id, botanical_name, common_name, plant_type FROM ola_plant_palette ORDER BY common_name'
  );

  const results = [];

  for (const item of extractedItems) {
    const name = (item.name || '').trim();
    if (!name) continue;

    const nameLower = name.toLowerCase()
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"');

    let bestMatch = null;
    let bestScore = 0;
    let matchType = 'none';

    for (const plant of allPlants) {
      const botLower = plant.botanical_name.toLowerCase();
      const comLower = plant.common_name.toLowerCase();

      // Exact match
      if (nameLower === botLower || nameLower === comLower) {
        bestMatch = plant;
        bestScore = 100;
        matchType = nameLower === botLower ? 'botanical_exact' : 'common_exact';
        break;
      }

      // Contains match (handles "Acer saccharum 'Sugar'" → "Acer saccharum")
      if (nameLower.includes(botLower) || botLower.includes(nameLower)) {
        const score = 85;
        if (score > bestScore) {
          bestMatch = plant;
          bestScore = score;
          matchType = 'botanical_partial';
        }
      }
      if (nameLower.includes(comLower) || comLower.includes(nameLower)) {
        const score = 80;
        if (score > bestScore) {
          bestMatch = plant;
          bestScore = score;
          matchType = 'common_partial';
        }
      }

      // Word overlap scoring
      const nameWords = nameLower.split(/\s+/);
      const botWords = botLower.split(/\s+/);
      const comWords = comLower.split(/\s+/);

      const botOverlap = nameWords.filter(w => botWords.includes(w)).length;
      const comOverlap = nameWords.filter(w => comWords.includes(w)).length;

      if (botOverlap > 0) {
        const score = Math.round((botOverlap / Math.max(nameWords.length, botWords.length)) * 70);
        if (score > bestScore) {
          bestMatch = plant;
          bestScore = score;
          matchType = 'botanical_fuzzy';
        }
      }
      if (comOverlap > 0) {
        const score = Math.round((comOverlap / Math.max(nameWords.length, comWords.length)) * 65);
        if (score > bestScore) {
          bestMatch = plant;
          bestScore = score;
          matchType = 'common_fuzzy';
        }
      }
    }

    results.push({
      original_name: name,
      quantity: item.quantity || 1,
      size: item.size || null,
      spacing: item.spacing || null,
      notes: item.notes || null,
      matched: bestScore >= 40,
      match_score: bestScore,
      match_type: matchType,
      plant: bestMatch ? {
        id: bestMatch.id,
        botanical_name: bestMatch.botanical_name,
        common_name: bestMatch.common_name,
        plant_type: bestMatch.plant_type,
      } : null,
    });
  }

  return results;
}

// ── POST /api/import/parse — Upload file and extract plant data ──

router.post('/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const ext = originalname.split('.').pop().toLowerCase();
    console.log(`[import] Parsing ${originalname} (${ext}, ${buffer.length} bytes)`);

    // Extract rows from file
    let rows;
    if (['xlsx', 'xls'].includes(ext)) {
      rows = extractFromExcel(buffer);
    } else if (['csv', 'tsv'].includes(ext)) {
      rows = extractFromCSV(buffer);
    } else if (ext === 'docx') {
      rows = await extractFromWord(buffer);
    } else if (ext === 'pdf') {
      rows = await extractFromPDF(buffer);
    } else {
      return res.status(400).json({ error: `Unsupported file type: .${ext}` });
    }

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'No data found in file' });
    }

    console.log(`[import] Extracted ${rows.length} rows from ${originalname}`);

    // Detect column mapping
    const { headerRow, columns } = detectColumns(rows);
    console.log(`[import] Header row: ${headerRow}, columns:`, columns);

    // Extract plant items from rows
    const dataRows = headerRow >= 0 ? rows.slice(headerRow + 1) : rows;
    const extractedItems = [];

    for (const row of dataRows) {
      // Build name from botanical and/or common columns
      let name = '';
      if (columns.botanical !== undefined) {
        name = row[columns.botanical] || '';
      }
      if (columns.common !== undefined) {
        const common = row[columns.common] || '';
        name = name ? name : common; // prefer botanical if we have it
        // If both exist, use botanical for matching but store common
      }
      // Fallback: just use first non-empty cell
      if (!name) {
        name = row.find(c => c && c.length > 2) || '';
      }

      if (!name || name.length < 2) continue;

      // Skip obvious non-plant rows
      const skip = /^(total|subtotal|page|date|project|client|prepared|note:|spec|section)/i;
      if (skip.test(name)) continue;

      extractedItems.push({
        name,
        botanical_name: columns.botanical !== undefined ? (row[columns.botanical] || '') : '',
        common_name: columns.common !== undefined ? (row[columns.common] || '') : '',
        quantity: columns.quantity !== undefined ? parseInt(row[columns.quantity]) || 1 : 1,
        size: columns.size !== undefined ? (row[columns.size] || null) : null,
        spacing: columns.spacing !== undefined ? (row[columns.spacing] || null) : null,
        notes: columns.notes !== undefined ? (row[columns.notes] || null) : null,
      });
    }

    console.log(`[import] Extracted ${extractedItems.length} plant items`);

    if (extractedItems.length === 0) {
      return res.status(400).json({
        error: 'Could not identify any plant names in the file',
        raw_rows: rows.slice(0, 5), // Send sample for debugging
      });
    }

    // Match against database
    const matched = await matchPlants(extractedItems);

    const matchedCount = matched.filter(m => m.matched).length;
    const unmatchedCount = matched.filter(m => !m.matched).length;

    console.log(`[import] Matched: ${matchedCount}, Unmatched: ${unmatchedCount}`);

    res.json({
      filename: originalname,
      total_rows: rows.length,
      items: matched,
      summary: {
        total_extracted: matched.length,
        matched: matchedCount,
        unmatched: unmatchedCount,
        columns_detected: columns,
        header_row: headerRow,
      },
    });
  } catch (error) {
    console.error('[import] Parse error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse file' });
  }
});

module.exports = router;
