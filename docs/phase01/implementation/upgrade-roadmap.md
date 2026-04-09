# Upgrade Roadmap

## Planning Principles

- Reliability before novelty
- Clear actionability before deeper analytics
- Low-bandwidth and unstable connectivity as first-class constraints
- Preserve the map-first experience while improving what supports it

## Recommended Order

1. Stage 1: Foundation
2. Stage 2: Awareness
3. Stage 3: Alerting
4. Stage 4: Resilience
5. Stage 5: Community

This order intentionally strengthens data trust, UI consistency, and place-based awareness before adding more demanding delivery channels and community features.

## Stage 1: Foundation

- Purpose: make the current app consistent, trustworthy, and failure-tolerant
- User value: users can interpret severity faster and trust source freshness more reliably
- Main features:
  - strict severity color system
  - shared risk logic across markers, cards, and detail panels
  - improved source handling, caching, and retry behavior
  - explicit stale and degraded source states
  - UI consistency rules for future feature growth
- Dependencies:
  - normalized incident model already in place
  - source health endpoints and cache controls
  - shared frontend severity tokens
- Implementation difficulty: medium
- Why first: every later stage depends on consistent severity, stable data handling, and predictable failure states

## Stage 2: Awareness

- Purpose: improve understanding of hazards on the map and around saved places
- User value: users understand not just that something happened, but where, how, and whether it affects their locations
- Main features:
  - better map visualization for earthquakes, typhoons, floods, volcanoes, and landslides
  - epicenter and track visualization
  - stronger saved-place monitoring
  - concise risk summaries by place
- Dependencies:
  - stage 1 severity system
  - better geographic metadata and place-to-incident matching
  - stable map rendering contract
- Implementation difficulty: medium
- Why second: better understanding should come before active notification delivery

## Stage 3: Alerting

- Purpose: move from passive awareness to timely, place-based warning delivery
- User value: users get notified when important incidents affect saved places or escalate
- Main features:
  - web push notifications for critical alerts
  - saved-place-based alert routing
  - escalation rules and opt-in preferences
  - notification UX for trust and fatigue control
- Dependencies:
  - stage 1 risk logic and stale handling
  - stage 2 place-based monitoring
  - backend event-change detection and notification queueing
- Implementation difficulty: medium to high
- Why third: alerting is only useful when severity, source trust, and place matching are already reliable

## Stage 4: Resilience

- Purpose: keep DisasterPH useful when networks and upstream systems are unstable
- User value: users can still open the app, review recent alerts, and access emergency contacts during degraded connectivity
- Main features:
  - PWA support
  - app shell and recent alert caching
  - offline fallback states
  - last-known alert viewing
  - lightweight offline emergency contact directory
- Dependencies:
  - stable client data model
  - cache-safe API responses
  - notification and saved-place flows already defined
- Implementation difficulty: high
- Why fourth: offline support is important, but it works best after the data and alert model are stable enough to cache intentionally

## Stage 5: Community

- Purpose: explore local situational awareness beyond official sources
- User value: users may eventually see road blockages, local flooding, and community observations that official feeds miss
- Main features:
  - crowdsourced reports
  - local flood and blocked-road reports
  - verification, moderation, and trust controls
  - abuse and misinformation protections
- Dependencies:
  - all prior stages
  - identity, moderation workflow, and trust model
  - privacy and legal review
- Implementation difficulty: high
- Why last: this is the highest-risk feature set for misinformation, moderation cost, and operational complexity

## What Should Wait

- Crowdsourced reporting should wait until the platform has strong severity logic, alerting discipline, and a clear moderation model.
- Full offline editing or submission flows should wait until read-only offline access is proven useful and safe.
- Deep analytics should remain secondary to resilience, saved-place monitoring, and trusted alerts.
