# DisasterPH

DisasterPH is a mobile-first, Philippines-focused disaster awareness dashboard built as a map-first command center. The MVP centers on a live national incident map, compact alert panels, source health visibility, and a normalized event model that can unify NASA EONET, PAGASA, and PHIVOLCS inputs.

## Current Starter Scope

- Next.js 16 App Router starter with a tactical command-center UI
- Responsive map-first homepage with desktop sidebar and mobile bottom sheet
- Normalized incident model and realistic Philippine mock data
- Mock API route at `/api/incidents`
- Product, technical, frontend, and backend planning docs
- Laravel example stubs for jobs, transformers, routes, and controller flow

## Folder Structure

```text
.
├── docs/
│   ├── alert-engine.md
│   ├── api-design.md
│   ├── architecture.md
│   ├── backend-implementation-plan.md
│   ├── data-model.md
│   ├── frontend-implementation-plan.md
│   ├── ingestion-pipeline.md
│   ├── mvp-scope.md
│   ├── product-overview.md
│   ├── roadmap.md
│   └── two-week-build-plan.md
├── skills/
│   └── disasterph/
│       ├── agents/openai.yaml
│       ├── references/
│       └── SKILL.md
├── src/
│   ├── app/
│   │   ├── api/incidents/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   └── page.tsx
│   ├── components/disasterph/
│   ├── data/mock-incidents.ts
│   ├── lib/
│   └── types/incident.ts
├── laravel-stubs/
│   ├── app/Http/Controllers/
│   ├── app/Jobs/
│   ├── app/Models/
│   └── app/Transformers/
└── README.md
```

## Design Direction

- Dark, tactical, modern command-center aesthetic
- Map-first layout with compact cards and fast scanning
- Mobile bottom sheet instead of a cramped sidebar
- Severity-forward incident markers and status surfaces
- Minimal but purposeful animation: pulsing markers, transitions, shimmer

## Data Model

Normalized incident shape:

```ts
{
  id,
  source,
  external_id,
  event_type,
  title,
  description,
  latitude,
  longitude,
  severity,
  region,
  started_at,
  updated_at,
  metadata
}
```

## Major Design Decisions

- The starter uses a custom tactical map canvas instead of shipping Leaflet immediately, so the UI runs with the repo's current dependencies and stays easy to review.
- The code is adapter-ready: incident projection, marker rendering, and the map viewport are isolated so a Leaflet or Mapbox implementation can replace the current canvas without disturbing the sidebar or data model.
- NASA EONET is treated as situational awareness metadata, not as an operational dispatch source.

## Run

```bash
npm run dev
```

## Next Steps

1. Add actual ingestion jobs and persistence in Laravel 11.
2. Replace the tactical map canvas with Leaflet while preserving the marker contract.
3. Add alert dedupe, escalation rules, and subscriptions.
