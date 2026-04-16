# Open Plant IQ Deployment & Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+ with `openfirehouse` database
- Database user: `daleraaen`

## Installation

### 1. Install Dependencies

```bash
cd /sessions/charming-inspiring-bardeen/mnt/Projects/OpenPlantIQ

# Server dependencies
npm install --prefix server

# Client dependencies
npm install --prefix client
```

### 2. Database Setup

The app will automatically:
1. Create tables if they don't exist (`ola_plant_palette`, `ola_plant_lists`, `ola_plant_list_items`)
2. Seed ~175 plants across 8 US regions if table is empty
3. Handle any missing columns with ALTER TABLE statements

No manual SQL required — just run the server.

### 3. Start the App

```bash
./start.sh
```

This will:
- Kill any existing processes on ports 3021 and 5189
- Start Express API server on http://localhost:3021
- Start Vite dev server on http://localhost:5189
- Display connection info

Open http://localhost:5189 in your browser.

## Project Structure

```
OpenPlantIQ/
├── server/
│   ├── src/
│   │   ├── index.js              # Express server, schema init, routes
│   │   ├── db.js                 # PostgreSQL connection pool
│   │   ├── seed-plants.js        # ~175 plants across 8 regions
│   │   └── routes/
│   │       ├── plants.js         # GET /api/plants with filters
│   │       └── lists.js          # CRUD for plant lists & items
│   ├── .env                      # DATABASE_URL, PORT=3021
│   └── package.json              # Express, pg, cors, compression (CommonJS)
├── client/
│   ├── src/
│   │   ├── App.jsx               # Main component, 5-tab nav
│   │   ├── main.jsx              # React entry point
│   │   ├── index.css             # Dark earthy theme
│   │   ├── components/
│   │   │   ├── PlantCard.jsx     # Reusable plant card component
│   │   │   └── OfflineBanner.jsx # Offline status indicator
│   │   └── tabs/
│   │       ├── BrowseTab.jsx     # Plant library with search/filters
│   │       ├── ZoneTab.jsx       # Zone finder + recommendations
│   │       ├── ListsTab.jsx      # View & manage saved lists
│   │       ├── NewListTab.jsx    # Create list & add plants
│   │       └── ExportTab.jsx     # PDF export (killer feature)
│   ├── index.html                # Mobile viewport, PWA manifest
│   ├── public/favicon.svg        # App icon
│   ├── vite.config.js            # Port 5189, /api proxy, PWA plugin
│   └── package.json              # React, Vite, Tailwind, vite-plugin-pwa
├── start.sh                      # Launcher script
└── README.md
```

## Database Schema

### ola_plant_palette (175+ plants)
```sql
id, botanical_name, common_name, plant_type (Tree/Shrub/Perennial/Grass/Groundcover/Succulent),
hardiness_zone (e.g., "4-8"), water_needs (Low/Moderate/High), mature_height, mature_width,
sun_requirement (Full Sun/Partial Sun/Partial Shade/Full Shade), bloom_color, season,
region (Northeast/Southeast/Midwest/Mountain West/Pacific Northwest/California/Southwest/Gulf Coast),
native_range, description (landscape use), image_url, created_at
```

### ola_plant_lists
```sql
id, name, description, project_name, client_name, zone, created_at, updated_at
```

### ola_plant_list_items
```sql
id, list_id (FK), plant_id (FK), quantity, size, spacing, notes, sort_order, created_at
```

## Key Features

### 1. Browse Tab
- Search plants by common/botanical name
- Filter by plant type, region
- View detailed plant information
- "Add to List" button

### 2. Zone Tab
- Auto-detect location with GPS
- Manual zone/ZIP input
- Show matching plants for zone
- Filter by type and water needs

### 3. Lists Tab
- View all saved plant lists
- Expand to see items in each list
- Delete lists
- Inline edit quantities
- "Export PDF" and "Add Plants" buttons

### 4. New List Tab
- Create list with name, project, client, zone
- Search and add plants
- View added plants in preview
- One-click removal

### 5. Export Tab (Killer Feature)
- Select a list from dropdown
- Professional PDF preview with:
  - Project/client metadata
  - Table: Botanical name (italic), Common name (bold), Type, Qty, Size, Spacing, Water, Zone
  - Total plant count
  - Professional header/footer
- "Generate PDF" button opens print dialog
- "Share List" button (navigator.share API)

## API Endpoints

### Plants
```
GET /api/plants                           # List all plants
  ?q=term                                 # Search term
  ?zone=5-6                              # Hardiness zone filter
  ?type=Tree                             # Plant type filter
  ?water=Low                             # Water needs filter
  ?region=Northeast                      # Region filter

GET /api/plants/:id                       # Single plant detail
GET /api/plants/stats/counts             # Stats (total, by type/zone/region)
GET /api/plants/recommendations/search   # Recommendations
  ?zone=5-6&sun=Full+Sun&water=Low      # Zone, sun, water params
```

### Lists
```
GET /api/lists                            # All lists with item counts
GET /api/lists/:id                        # List detail with items joined to plants
POST /api/lists                           # Create list
  { name, description?, project_name?, client_name?, zone? }
PUT /api/lists/:id                        # Update list metadata
DELETE /api/lists/:id                     # Delete list (cascades items)
POST /api/lists/:id/items                 # Add plant to list
  { plant_id, quantity?, size?, spacing?, notes? }
PUT /api/lists/:listId/items/:itemId     # Update item
DELETE /api/lists/:listId/items/:itemId  # Remove item from list
```

## Styling & Colors

Dark earthy theme — optimized for field work outdoors:
- Background: `#0f1f12` (plant-bg)
- Card: `#1a2e1d` (plant-card) / `#152618` (plant-card2)
- Border: `#2d4a32` (plant-border)
- Text: `#e8f5e9` (plant-text)
- Accent: `#4caf50` (plant-accent) — green plant icon
- Muted: `#81c784` (plant-muted)
- Warm: `#8d6e63` (plant-warm)

All using Tailwind CSS utilities. No custom CSS classes.

## Mobile & PWA

**Responsive Design**:
- Bottom tab navigation with 5 tabs
- 48px+ touch targets throughout
- Horizontal scrollable filter chips
- Safe area insets for notched devices

**Progressive Web App**:
- Installs to home screen (iOS/Android)
- Works offline (cached assets + API data)
- Service worker for background sync
- Manifest with app icons and colors

## Development Workflow

### Running Locally

```bash
./start.sh                                 # Start both servers
```

Press Ctrl+C to stop.

### Hot Reload

- **Client**: Vite hot reload on file changes (port 5189)
- **Server**: Node `--watch` flag for auto-restart (port 3021)

### Building for Production

```bash
cd client
npm run build                              # Creates ./dist
npm run preview                            # Preview built app
```

## Troubleshooting

### "Port 5189 or 3021 already in use"
```bash
lsof -i :5189                              # Find process
kill -9 <PID>
# Or use start.sh which auto-kills
./start.sh
```

### "Cannot find module 'lucide-react'"
```bash
npm install --prefix client
```

### "Database connection failed"
```bash
# Check PostgreSQL is running:
psql -U daleraaen -d openfirehouse -c "SELECT 1"

# Check .env file:
cat server/.env
# Should have: DATABASE_URL=postgresql://daleraaen@localhost:5432/openfirehouse
```

### "Plants not seeding"
The seed runs on first server start if table has < 50 plants. Check server logs for:
```
Seeding plants... (currently 0 plants)
Seeding complete. Total plants: 175
```

## Performance Notes

- All queries limit to 1000 results
- API proxied from client at `/api` → `http://localhost:3021/api`
- Database connection pooled (pg pool)
- Compression enabled on Express
- Client bundled with Vite (chunks, lazy loading)

## Security Notes

- No authentication required (standalone field tool)
- CORS enabled for localhost (vite proxy handles in dev)
- SQL queries parameterized (pg prepared statements)
- No sensitive data stored (plants + lists only)

## Scaling Considerations

For production deployment:
1. Move to managed PostgreSQL (AWS RDS, etc.)
2. Add authentication (JWT with users table)
3. Deploy API to Node host (Heroku, Railway, etc.)
4. Deploy client to CDN (Vercel, Netlify, etc.)
5. Add API rate limiting
6. Enable HTTPS
7. Add logging/monitoring
8. Implement data export for backup

## Support

For questions or issues:
1. Check server logs: `npm run dev --prefix server`
2. Check browser console: DevTools → Console
3. Review API responses: DevTools → Network
4. Check database: `psql -U daleraaen -d openfirehouse -c "SELECT COUNT(*) FROM ola_plant_palette"`
