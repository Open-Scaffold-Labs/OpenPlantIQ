'use strict';
const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /api/lists - all saved plant lists
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT l.*, COUNT(li.id) as item_count
      FROM ola_plant_lists l
      LEFT JOIN ola_plant_list_items li ON l.id = li.list_id
      GROUP BY l.id
      ORDER BY l.updated_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/lists/:id - single list with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const listResult = await query('SELECT * FROM ola_plant_lists WHERE id = $1', [id]);
    
    if (listResult.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    const itemsResult = await query(`
      SELECT li.*, p.botanical_name, p.common_name, p.plant_type, p.hardiness_zone, p.water_needs, p.sun_requirement
      FROM ola_plant_list_items li
      JOIN ola_plant_palette p ON li.plant_id = p.id
      WHERE li.list_id = $1
      ORDER BY li.sort_order, li.id
    `, [id]);

    res.json({
      ...listResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Error fetching list:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lists - create list
router.post('/', async (req, res) => {
  try {
    const { name, description, project_name, client_name, zone } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'List name is required' });
    }

    const result = await query(`
      INSERT INTO ola_plant_lists (name, description, project_name, client_name, zone, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [name, description || null, project_name || null, client_name || null, zone || null]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/lists/:id - update list metadata
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, project_name, client_name, zone } = req.body;

    const result = await query(`
      UPDATE ola_plant_lists 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          project_name = COALESCE($3, project_name),
          client_name = COALESCE($4, client_name),
          zone = COALESCE($5, zone),
          updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [name, description, project_name, client_name, zone, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/lists/:id - delete list
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM ola_plant_lists WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    res.json({ message: 'List deleted' });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/lists/:id/items - add plant to list
router.post('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { plant_id, quantity, size, spacing, notes } = req.body;

    if (!plant_id) {
      return res.status(400).json({ error: 'plant_id is required' });
    }

    // Get sort order
    const maxResult = await query('SELECT MAX(sort_order) as max_order FROM ola_plant_list_items WHERE list_id = $1', [id]);
    const sort_order = (maxResult.rows[0]?.max_order || 0) + 1;

    const result = await query(`
      INSERT INTO ola_plant_list_items (list_id, plant_id, quantity, size, spacing, notes, sort_order, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [id, plant_id, quantity || 1, size || null, spacing || null, notes || null, sort_order]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding item to list:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/lists/:listId/items/:itemId - update item
router.put('/:listId/items/:itemId', async (req, res) => {
  try {
    const { listId, itemId } = req.params;
    const { quantity, size, spacing, notes } = req.body;

    const result = await query(`
      UPDATE ola_plant_list_items 
      SET quantity = COALESCE($1, quantity),
          size = COALESCE($2, size),
          spacing = COALESCE($3, spacing),
          notes = COALESCE($4, notes)
      WHERE id = $5 AND list_id = $6
      RETURNING *
    `, [quantity, size, spacing, notes, itemId, listId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/lists/:listId/items/:itemId - remove item from list
router.delete('/:listId/items/:itemId', async (req, res) => {
  try {
    const { listId, itemId } = req.params;
    const result = await query('DELETE FROM ola_plant_list_items WHERE id = $1 AND list_id = $2 RETURNING *', [itemId, listId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item removed' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
