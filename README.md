# Open Plant IQ

A mobile-first plant reference and schedule tool for landscape architects. Part of the OpenScaffold ecosystem but runs standalone.

## Features

- **Browse**: Search and filter plant library (175+ plants across US regions and hardiness zones)
- **Zone Finder**: Automatic location detection or manual zone selection with plant recommendations
- **Plant Lists**: Create and manage multiple plant schedules for different projects
- **PDF Export**: Generate professional plant schedules for client handoff (the killer feature!)
- **Offline Support**: PWA with offline mode for field work
- **Mobile-First**: Optimized for tablets and landscape design on-site

## Quick Start

```bash
cd /sessions/charming-inspiring-bardeen/mnt/Projects/OpenPlantIQ
npm install --prefix server
npm install --prefix client
./start.sh
```

Then open http://localhost:5189

## Architecture

**Server**: Express.js + PostgreSQL (port 3021)
- Database: `openfirehouse` shared with other OpenScaffold apps
- Tables: `ola_plant_palette`, `ola_plant_lists`, `ola_plant_list_items`
- Includes ~175 plants seeded from 8 US regions

**Client**: React 19 + Vite + Tailwind (port 5189)
- 5-tab bottom navigation UI
- Responsive dark earthy theme (greens/browns)
- PWA manifest for offline and home screen install
- Professional PDF generation for plant schedules

## Database

Plants are seeded across these regions:
- Northeast (Zones 4-7)
- Southeast (Zones 7-9)
- Midwest (Zones 4-6)
- Mountain West (Zones 3-6)
- Pacific Northwest (Zones 6-8)
- California (Zones 8-11)
- Southwest (Zones 8-10)
- Gulf Coast (Zones 8-10)

Each plant record includes:
- Botanical and common names
- Plant type (Tree/Shrub/Perennial/Grass/Groundcover/Succulent)
- Hardiness zone range
- Water needs (Low/Moderate/High)
- Mature dimensions
- Sun requirements
- Bloom color and season
- Native range and description

## The Killer Feature: PDF Export

From the **Export** tab, generate professional plant schedules with:
- Project and client metadata
- Formatted table with botanical names (italic), common names (bold)
- Quantity, size, spacing columns
- Water needs and zone info
- Professional header and footer
- Ready to print or email to clients

## Mobile & PWA

- Installs to home screen on iOS/Android
- Works offline with cached data
- Safe area insets for notched devices
- 48px+ touch targets throughout
- Horizontal scrollable filters
- Full-screen standalone display

## API Endpoints

### Plants
- `GET /api/plants` — list with optional filters (q, zone, type, water, region)
- `GET /api/plants/:id` — single plant detail
- `GET /api/plants/stats/counts` — statistics

### Lists
- `GET /api/lists` — all saved lists
- `GET /api/lists/:id` — list with items
- `POST /api/lists` — create new list
- `PUT /api/lists/:id` — update metadata
- `DELETE /api/lists/:id` — delete list
- `POST /api/lists/:id/items` — add plant to list
- `PUT /api/lists/:listId/items/:itemId` — update item
- `DELETE /api/lists/:listId/items/:itemId` — remove item

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide icons
- **Backend**: Express.js, PostgreSQL, cors, compression
- **Auth**: None (standalone app)
- **PWA**: vite-plugin-pwa
- **Styling**: Dark earthy theme (#0f1f12 bg, #4caf50 accent)

## Notes

- No @openscaffold/core dependency — fully standalone
- All server code uses CommonJS (require, not import)
- Botanical names always display in italic
- Plant descriptions focused on landscape use value
- All data via `/api/` prefix
- 48px minimum touch targets (mobile-friendly)
