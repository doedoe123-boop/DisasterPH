# Architecture Upgrade Notes

## Keep What Works

The current direction can stay lean for a while:

- `Next.js` can continue to power the app shell, map-first UI, saved places, and read-side data presentation
- `Vercel` can continue serving the frontend and simple server-side routes
- `Laravel 11 API` should remain the main home for ingestion, normalization, source monitoring, and alert logic

## What Can Stay In Next.js / Vercel

- UI rendering and route handling
- client-side saved places management, if kept lightweight
- read-only cached views of recent alerts
- PWA shell behavior and service worker registration
- compact emergency resource directory presentation

## What Can Be Handled Client-Side

- map interaction and visualization
- saved-place display and local preference state
- offline banner and cached-view UX
- lightweight risk summaries derived from already-normalized API payloads

Client-side logic should remain presentation-focused. Core severity decisions and alert eligibility should not drift into many separate client rules.

## What Likely Needs Background Jobs Or Additional Services

- source polling and retry orchestration
- stale-source monitoring
- push notification fan-out
- alert dedupe and escalation evaluation
- future geospatial preprocessing for tracks, zones, or place matching
- any future community moderation queue

These are better handled in Laravel jobs, workers, and scheduled tasks than in frontend-hosted functions.

## What May Require Additional Services Later

- web push infrastructure and subscription storage
- durable queue workers beyond simple starter scale
- analytics or event logging infrastructure
- object storage if future community reporting includes media
- observability tooling for source health and notification delivery

None of these should be added early unless usage or operational pain justifies them.

## Recommended Architecture Path

### Near Term

- Keep frontend on Next.js and Vercel
- Keep backend logic in Laravel with MySQL
- Strengthen queues, retries, dedupe, and source health first

### Mid Term

- Add push notification service integration
- Add service worker and carefully scoped offline caches
- Add place-matching utilities and richer geospatial support in backend jobs when needed

### Later

- Add moderation workflows only if community reporting becomes a real product commitment
- Add dedicated observability and delivery infrastructure when scale or operational risk requires it

## Overengineering To Avoid

- Do not move too much hazard logic into the browser
- Do not introduce multiple data stores early without clear need
- Do not add heavy geospatial stacks before simpler region-and-radius matching is exhausted
- Do not build community pipelines before official-source reliability is strong

## Practical Guidance

- Keep the system split simple:
  - frontend for experience
  - backend for truth and workflows
- Push reliability and offline usefulness should build on stable normalized data, not bypass it
- Every new service should earn its complexity by solving a real operational constraint
