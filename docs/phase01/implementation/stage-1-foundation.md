# Stage 1: Foundation

## Objective

Make DisasterPH more dependable before adding complex delivery or community features. This stage is about consistency, trust, and graceful failure handling.

## Why This Stage Comes First

If severity colors, source freshness, and stale handling are inconsistent, every later feature becomes harder to trust. Push notifications and offline caching are especially dangerous when the underlying risk model is noisy or unclear.

## Scope

### Strict Severity Model

- Define one severity ladder used everywhere:
  - `safe` or `normal` for no active concern
  - `yellow` for advisory or monitor state
  - `orange` for watch or elevated concern
  - `red` for warning or critical action state
- Map this model consistently to:
  - map markers
  - alert bars
  - feed cards
  - badges
  - detail panels
  - saved-place summaries

### Shared Risk Logic

- Centralize severity mapping from normalized incident data
- Avoid per-component severity interpretation
- Make source-specific thresholds explicit in backend transform or risk services
- Add a shared frontend helper for display severity and color token selection

### Improved Source Handling

- Track source freshness and degraded states per source
- Distinguish:
  - healthy
  - delayed
  - degraded
  - unavailable
- Ensure source outages do not silently remove last-known incidents
- Add structured source error notes suitable for operator review

### Better Caching

- Cache normalized incident responses for short durations
- Cache source health separately from main incident lists
- Prefer stale-while-revalidate style behavior where safe
- Keep caches small and predictable to avoid serving dangerously outdated data as current

### Stale and Failure States

- Show visible stale timestamps when data freshness exceeds SLA
- Add empty and degraded states for:
  - full source outage
  - partial source outage
  - no incidents for filter
  - map data unavailable but list data still present
- Use calm, practical messaging instead of generic error copy

### UI Consistency Before Scaling

- Freeze severity colors and badge patterns before adding more feature surfaces
- Create shared visual tokens for alerts, panels, and saved-place states
- Ensure the first screen remains map-first even when more panels are added

## Deliverables

- Shared severity design tokens
- Shared risk mapping utilities
- Source freshness rules and SLA definitions
- Stale-state UI patterns
- Retry and fallback behavior notes for ingestion and frontend fetches

## Dependencies

- Current normalized incident model
- Backend source metadata and fetch-run tracking
- Existing map marker system

## Technical Considerations

- Do not let short-lived cache optimizations hide stale data problems
- Avoid source-specific UI logic scattered across components
- Keep severity computation explainable for debugging and future auditing

## Recommended Acceptance Criteria

- A user sees the same severity meaning everywhere in the app
- Source outages are visible and understandable
- Last-known data is preserved safely when a source fails
- UI states stay clear under empty, stale, or degraded conditions
