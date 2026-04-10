# Technical Risks

## Source Reliability Risks

- Government pages may change layout without notice
- Some sources may be HTML-first rather than API-first
- Parsing logic can break silently if selectors or formats shift

## Government Site And API Instability

- Upstream slowness or downtime may spike during major events
- Rate limiting or anti-bot protections may appear unpredictably
- Some sites may not offer ideal machine-readable contracts

## Stale Data Risks

- Cached results may remain visible longer than intended
- Users may misread last-known data as live data
- Multi-source incidents may become inconsistent when one source lags

## Push Notification Reliability

- Browser support differs across platforms
- Delivery is not guaranteed in all network conditions
- Users may disable permissions after alert fatigue or confusing messages

## Offline Caching Limitations

- Service worker bugs can trap stale assets or stale JSON
- Storage limits vary across browsers and devices
- Large offline map assets can harm low-end mobile performance

## Crowdsourced Misinformation Risk

- False reports can spread panic
- Coordinated abuse can distort perceived local conditions
- Low-context reports may be sincere but still misleading

## Privacy Concerns

- Saved places are sensitive household data
- Push subscriptions, location associations, and community reports require careful data minimization
- Emergency contacts and place labels should not expose personal routines unnecessarily

## Mobile Performance Risks

- Heavy geospatial overlays can slow rendering on low-end phones
- Large cached payloads can increase startup time
- Excess animation or too many simultaneous markers can reduce responsiveness

## Recommended Mitigations

- Build explicit stale-data states
- Isolate source adapters and monitor failures
- Use conservative caching rules
- Start push notifications with narrow triggers
- Treat saved-place data as sensitive by default
- Delay crowdsourcing until moderation capacity exists
