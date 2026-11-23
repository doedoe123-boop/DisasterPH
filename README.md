# DisasterPH

**Real-time disaster monitoring and family safety tool for the Philippines.**

DisasterPH pulls live hazard data from PAGASA, PHIVOLCS, and NASA EONET, plots it on an interactive map, and helps users answer four questions during a disaster:

1. Is my family's area affected?
2. How serious is it?
3. What should I do right now?
4. Where can I get trusted help?

Built with Next.js 16, React 19, MapLibre GL JS, and Tailwind CSS 4.

---

## Features

### Live Hazard Map

- Interactive [MapLibre GL JS](https://maplibre.org/) map with Carto dark-matter tiles (free, no token)
- Severity-colored markers with real-time pulse animation
- Click-to-select, hover tooltips, fly-to-incident camera
- Sidebar-aware bounds fitting for the Philippine archipelago

### Multi-Source Ingestion

- **PHIVOLCS** — Earthquakes via bulletin scraping
- **PAGASA** — Tropical cyclones and weather advisories
- **NASA EONET** — Volcanoes, wildfires, floods, landslides
- In-memory store with TTL-based cache and automatic polling (60s incidents, 120s advisories)
- Normalized into a single `Incident` model with unified severity scale

### Saved Places & Family Monitoring

- Save locations (home, work, family, school) with localStorage persistence
- Per-place risk assessment using haversine proximity (100 km radius)
- Risk levels: **Safe → Monitor → At Risk → Danger**
- One-tap quick-add for major Philippine cities

### Contextual Safety Guidance

- **"What To Do" panel** — Hazard-specific preparation tips (typhoon, flood, earthquake, volcano, landslide, wildfire)
- Tips filtered by urgency: _Do Now_, _Prepare_, _Know_ — based on incident severity
- **Dynamic Help & Safety actions** — Emergency hotlines (NDRRMC, Red Cross), agency links (PAGASA, PHIVOLCS), share/copy incident details
- Context-aware: high-severity incidents surface emergency contacts first

### Official Advisories

- Aggregated from PAGASA and PHIVOLCS
- Severity-colored, collapsible list with source attribution

### Responsive Layout

- Desktop: map + expandable/collapsible sidebar with keyboard shortcuts (`F` focus mode, `Esc` exit)
- Mobile: full-screen map with bottom sheet for incident details
- Focus mode hides all chrome for map-only viewing

---

## Tech Stack

| Layer     | Technology                                         |
| --------- | -------------------------------------------------- |
| Framework | Next.js 16.2.2 (App Router, Turbopack)             |
| UI        | React 19.2.4, Tailwind CSS 4                       |
| Map       | MapLibre GL JS 5 (Carto dark-matter basemap)       |
| Language  | TypeScript 5                                       |
| Data      | Server-side ingestion → in-memory store → REST API |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── incidents/            # GET /api/incidents, /api/incidents/[id]
│   │   ├── advisories/           # GET /api/advisories
│   │   ├── source-status/        # GET /api/source-status
│   │   ├── reports/              # Community reports (moderated)
│   │   ├── moderator/            # Moderator session
│   │   └── push/                 # Web Push subscriptions and dispatch
│   ├── archive/                  # Disaster event archive
│   ├── pulse/                    # Alert list and alert details
│   ├── shelters/                 # Evacuation centers
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Place-first live map homepage
├── components/disasterph/
│   ├── disasterph-command.tsx    # Homepage orchestration (state lives here)
│   ├── area-bar.tsx              # "Your area" selector and "Use my location"
│   ├── command-map.tsx           # Map wrapper with sidebar/focus controls
│   ├── mapbox-map.tsx            # MapLibre map, markers, popups, camera
│   ├── header.tsx                # Top bar, navigation, 911 button
│   ├── emergency-contacts.tsx    # Emergency hotlines
│   ├── hazard-empty-state.tsx    # Explains empty hazard filters
│   ├── notification-bell.tsx
│   ├── prep-guidance.tsx         # "What To Do" safety tips
│   ├── page-skeletons.tsx
│   └── sw-registrar.tsx          # Service worker registration
├── hooks/
│   ├── use-incidents.ts          # Polling hook (60s)
│   ├── use-selected-area.ts      # Chosen area (localStorage)
│   ├── use-saved-places.ts       # localStorage-backed saved places
│   ├── use-alert-center.ts
│   ├── use-network-status.ts
│   ├── useLocale.ts
│   └── useTheme.ts
├── lib/
│   ├── ingest/                   # Source fetchers + scheduler
│   │   ├── eonet.ts              # NASA EONET events
│   │   ├── pagasa.ts             # PAGASA tropical cyclone bulletins
│   │   ├── phivolcs.ts           # PHIVOLCS earthquake bulletins
│   │   ├── store.ts              # In-memory store with TTL cache
│   │   ├── scheduler.ts          # Auto-polling orchestrator
│   │   ├── regions.ts            # Region metadata for incidents
│   │   └── types.ts              # Ingestion types
│   ├── geo/ph-regions.ts         # PSGC region lookup (incl. offshore)
│   ├── area.ts                   # Selected-area matching
│   ├── hotlines.ts               # Emergency and agency numbers
│   ├── incidents.ts              # Filtering, sorting, stats, PHT times
│   ├── i18n.ts                   # English and Filipino strings
│   ├── map-camera.ts             # Camera rules (fit, focus, padding)
│   ├── mapbox.ts                 # Map constants (bounds, colors, camera)
│   ├── terrain.ts                # Opt-in 3D terrain
│   ├── risk-summary.ts           # Proximity risk computation
│   ├── prep-guidance.ts          # Per-hazard preparation tips
│   └── …                         # Reports, push, moderation, rate limits
├── types/
│   └── incident.ts               # Core type definitions
└── data/
    ├── ph-regions.json           # Region boundaries (see LICENSE file)
    └── archive-events.ts         # Archive page data
docs/                             # Product, architecture, and planning docs
supabase/                         # SQL migrations
scripts/                          # Data build scripts (region boundaries)
```

---

## Data Model

All hazard events are normalized into a single `Incident` type:

```ts
interface Incident {
  id: string;
  source: "EONET" | "PAGASA" | "PHIVOLCS";
  external_id: string;
  event_type:
    | "typhoon"
    | "flood"
    | "earthquake"
    | "volcano"
    | "landslide"
    | "wildfire";
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: "advisory" | "watch" | "warning" | "critical";
  region: string;
  started_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  metadata: Record<string, string | number | boolean | null>;
}
```

Saved places compute a `PlaceRiskSummary` with nearby incidents, highest severity, nearest distance, and a derived risk level.

---

## API Routes

| Endpoint              | Method | Description                                               |
| --------------------- | ------ | --------------------------------------------------------- |
| `/api/incidents`      | GET    | All active incidents. Optional `?type=earthquake` filter. |
| `/api/incidents/[id]` | GET    | Single incident by ID.                                    |
| `/api/advisories`     | GET    | Official advisories from PAGASA/PHIVOLCS.                 |
| `/api/source-status`  | GET    | Health status of each data source.                        |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build && npm start
```

The app fetches live data on startup — no API keys or external services required. PAGASA and PHIVOLCS are scraped directly; NASA EONET is a public API.

---

## Sidebar Information Hierarchy

The expanded sidebar presents information in priority order:

1. **My Places** — Saved locations with at-a-glance risk status
2. **Risk Summary** — Shown when a saved place is selected; nearby incidents and threat level
3. **Incident Details** — Selected incident with severity, location, metadata
4. **What To Do** — Preparation guidance matched to current hazard type and severity
5. **Help & Safety** — Emergency hotlines, agency links, share/copy
6. **Official Alerts** — PAGASA/PHIVOLCS advisories
7. **Live Feed** — Collapsible list of all active incidents
8. **System Status** — Source count, active alerts, regions tracked

---

## Design Decisions

- **MapLibre over Mapbox** — Free, no token required, same GL JS API surface
- **Runtime dynamic import** for MapLibre to avoid Turbopack static analysis issues
- **In-memory store** with TTL cache — no database needed for MVP; data refreshes from sources on schedule
- **Marker transitions on inner div** — root marker `transform` is managed by MapLibre; animations live on `.marker-inner` to prevent positioning conflicts
- **Haversine proximity** for saved place risk — simple, fast, works offline with no geocoding dependency
- **NASA EONET as situational awareness** — not treated as operational dispatch, augments Philippine-source data

---

## License

Private — not yet licensed for distribution.
