# Architecture

## Frontend Responsibilities

- Render a map-first monitoring interface
- Display selected incident details without losing map context
- Show source health, freshness, filters, and compact stats
- Keep mobile behavior centered on a map plus bottom sheet pattern

## Backend Responsibilities

- Fetch upstream source data
- Normalize source-specific payloads
- Persist incidents and fetch-run metadata
- Evaluate alert rules and dispatch notifications
- Expose stable API contracts for the frontend

## Suggested Stack

- Frontend: Next.js + React + Tailwind
- Motion: Framer Motion
- Map: Leaflet first, with an adapter path for later Mapbox migration
- Backend: Laravel 11 API
- Database: MySQL
- Queues and scheduler: Laravel queue workers plus scheduler

## Ingestion Flow

1. Scheduler dispatches per-source ingestion jobs
2. Fetcher acquires upstream data
3. Transformer normalizes data into incidents
4. Validator checks required fields and source assumptions
5. Dedupe compares identity and content hash
6. Persistence upserts incidents and records source health

## Alert Flow

1. Incident changes are detected after ingestion
2. Alert rules evaluate severity, freshness, source trust, and delta
3. Dedupe prevents repeated outbound notifications
4. Notifications fan out through email, SMS, webhook, or in-app channels

## API Conventions

- Use resource-oriented JSON
- Keep normalized incident shape consistent across endpoints
- Include source freshness metadata in list and health endpoints when relevant
- Prefer `/api/v1/*` for backend routes once production APIs are active
