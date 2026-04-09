# Stage 4: Resilience

## Objective

Keep DisasterPH useful when users face poor connectivity, high latency, or temporary source downtime during real disasters.

## Why This Stage Matters

The app is most needed when infrastructure is least reliable. Resilience features should focus on practical read access and low-friction safety support, not complex offline workflows.

## Scope

### PWA And Offline Mode

- Add installable PWA support where appropriate
- Cache the core app shell for fast reloads
- Preserve key navigation and saved places locally
- Keep the offline experience intentionally limited and honest

### App Shell Caching

- Cache:
  - shell assets
  - last successful home view structure
  - recent alert summaries
  - saved emergency resources
- Revalidate aggressively when connectivity returns

### Offline Fallback States

- Show a clear offline banner
- Distinguish:
  - offline with cached data available
  - offline without cached data
  - online but source data degraded
- Make it obvious that cached alerts are last-known information

### Cached Alert Viewing

- Allow users to review the latest successfully cached alerts
- Store only a practical recent window instead of large archives
- Include visible timestamps and source freshness status

### Lightweight Offline Directory

- Cache emergency contacts and quick dial resources such as:
  - NDRRMC
  - Philippine Red Cross
  - local emergency hotlines where feasible
- Keep the directory lightweight and easy to access from the home view

## Dependencies

- Stable alert and source freshness model
- Cache-safe API responses
- Browser storage strategy
- Minimal emergency resource data model

## Technical Considerations

- Service worker complexity can create stale data bugs if not tightly scoped
- Cache only what is safe and understandable
- Avoid caching large map assets or overly detailed offline datasets too early
- Design for low-memory devices

## Tradeoffs

- Read-only offline access should come before offline submissions or complex syncing
- Cached recent alerts are more valuable than trying to replicate the full live app offline
- Emergency contacts offer strong value for low implementation cost

## Recommended Acceptance Criteria

- The app opens reliably with a cached shell
- Users can see last-known alerts when offline
- Offline states are explicit and not misleading
- Emergency contacts remain available even with limited connectivity
