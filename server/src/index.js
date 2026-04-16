'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { pool, query } = require('./db');
const { seedPlants } = require('./seed-plants');

const app = express();
const PORT = process.env.PORT || 3021;

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/plants', require('./routes/plants'));
app.use('/api/lists', require('./routes/lists'));
app.use('/api/import', require('./routes/import'));

// Initialize database schema
async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');

    // Create plant palette table with all columns
    await query(`
      CREATE TABLE IF NOT EXISTS ola_plant_palette (
        id SERIAL PRIMARY KEY,
        botanical_name TEXT NOT NULL,
        common_name TEXT NOT NULL,
        plant_type TEXT,
        hardiness_zone TEXT,
        water_needs TEXT,
        mature_height TEXT,
        mature_width TEXT,
        sun_requirement TEXT,
        bloom_color TEXT,
        season TEXT,
        region TEXT,
        native_range TEXT,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add columns if they don't exist
    await query(`
      ALTER TABLE ola_plant_palette 
      ADD COLUMN IF NOT EXISTS region TEXT,
      ADD COLUMN IF NOT EXISTS native_range TEXT
    `);

    // Create plant lists table
    await query(`
      CREATE TABLE IF NOT EXISTS ola_plant_lists (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        project_name TEXT,
        client_name TEXT,
        zone TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create plant list items table
    await query(`
      CREATE TABLE IF NOT EXISTS ola_plant_list_items (
        id SERIAL PRIMARY KEY,
        list_id INTEGER REFERENCES ola_plant_lists(id) ON DELETE CASCADE,
        plant_id INTEGER REFERENCES ola_plant_palette(id),
        quantity INTEGER DEFAULT 1,
        size TEXT,
        spacing TEXT,
        notes TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('Database schema initialized successfully');

    // Seed plants
    await seedPlants({ query });

  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

// Start server
async function start() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`Open Plant IQ API running on http://localhost:${PORT}`);
  });
}

start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await pool.end();
  process.exit(0);
});
