'use strict';
const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /api/plants - list plants with filters
router.get('/', async (req, res) => {
  try {
    const { q, zone, type, water, region } = req.query;
    let sql = 'SELECT * FROM ola_plant_palette WHERE 1=1';
    const params = [];
    let paramNum = 1;

    if (q) {
      sql += ` AND (LOWER(botanical_name) LIKE $${paramNum} OR LOWER(common_name) LIKE $${paramNum})`;
      params.push(`%${q.toLowerCase()}%`);
      paramNum++;
    }

    if (zone) {
      sql += ` AND hardiness_zone LIKE $${paramNum}`;
      params.push(`%${zone}%`);
      paramNum++;
    }

    if (type) {
      sql += ` AND plant_type = $${paramNum}`;
      params.push(type);
      paramNum++;
    }

    if (water) {
      sql += ` AND water_needs = $${paramNum}`;
      params.push(water);
      paramNum++;
    }

    if (region) {
      sql += ` AND region LIKE $${paramNum}`;
      params.push(`%${region}%`);
      paramNum++;
    }

    sql += ' ORDER BY common_name LIMIT 1000';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/plants/:id - single plant detail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM ola_plant_palette WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching plant:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/plants/zones - list all zones
router.get('/zones/all', async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT hardiness_zone 
      FROM ola_plant_palette 
      WHERE hardiness_zone IS NOT NULL 
      ORDER BY hardiness_zone
    `);
    res.json(result.rows.map(r => r.hardiness_zone));
  } catch (error) {
    console.error('Error fetching zones:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/plants/types - list plant types
router.get('/types/all', async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT plant_type 
      FROM ola_plant_palette 
      WHERE plant_type IS NOT NULL 
      ORDER BY plant_type
    `);
    res.json(result.rows.map(r => r.plant_type));
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/plants/stats - counts by type, zone, region
router.get('/stats/counts', async (req, res) => {
  try {
    const typeResult = await query(`
      SELECT plant_type, COUNT(*) as count 
      FROM ola_plant_palette 
      GROUP BY plant_type 
      ORDER BY count DESC
    `);
    const zoneResult = await query(`
      SELECT hardiness_zone, COUNT(*) as count 
      FROM ola_plant_palette 
      GROUP BY hardiness_zone 
      ORDER BY hardiness_zone
    `);
    const regionResult = await query(`
      SELECT region, COUNT(*) as count 
      FROM ola_plant_palette 
      WHERE region IS NOT NULL 
      GROUP BY region
    `);
    const totalResult = await query('SELECT COUNT(*) FROM ola_plant_palette');

    res.json({
      total: parseInt(totalResult.rows[0].count),
      byType: typeResult.rows,
      byZone: zoneResult.rows,
      byRegion: regionResult.rows
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/plants/recommendations - given zone + sun + water
router.get('/recommendations/search', async (req, res) => {
  try {
    const { zone, sun, water } = req.query;
    let sql = 'SELECT * FROM ola_plant_palette WHERE 1=1';
    const params = [];
    let paramNum = 1;

    if (zone) {
      sql += ` AND hardiness_zone LIKE $${paramNum}`;
      params.push(`%${zone}%`);
      paramNum++;
    }

    if (sun) {
      sql += ` AND sun_requirement LIKE $${paramNum}`;
      params.push(`%${sun}%`);
      paramNum++;
    }

    if (water) {
      sql += ` AND water_needs = $${paramNum}`;
      params.push(water);
      paramNum++;
    }

    sql += ' ORDER BY common_name LIMIT 500';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
