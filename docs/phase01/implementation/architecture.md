# Architecture

## High-Level Shape

- `Next.js 16` provides the operator dashboard and mock API contract examples.
- `Laravel 11 API` owns ingestion, normalization, persistence, dedupe, scheduling, and notification delivery.
- `MySQL` stores incidents, sources, fetch runs, notifications, and audit metadata.
- `Queues` isolate slow parsing, fetch retries, and downstream alert evaluation.

## Frontend Architecture

- `app/page.tsx` is the route entry.
- `components/disasterph/*` holds the command-center UI.
- `types/incident.ts` defines the normalized shared contract.
- `data/mock-incidents.ts` represents realistic seed data.
- `lib/incidents.ts` and `lib/map.ts` hold formatting and projection utilities.

## Backend Architecture

- `Fetchers` gather upstream raw data.
- `Transformers` convert source-specific payloads into a normalized incident shape.
- `Ingestion Jobs` run per source and write normalized records.
- `Alert Engine` evaluates incident changes and triggers notifications.
- `Source Monitor` records health, latency, and stale-source status.

## Integration Boundaries

- Frontend consumes `/api/incidents`, `/api/incidents/{id}`, `/api/sources/health`.
- Backend stores normalized incidents and exposes resource-oriented JSON.
- Upstream source adapters remain isolated so failures in one feed do not block the rest.

## Map Strategy

- Current starter uses a tactical visual canvas with projected markers.
- Leaflet can replace the current viewport behind the same `CommandMap` contract.
- Future Mapbox migration should target an adapter layer instead of touching incident panels.
