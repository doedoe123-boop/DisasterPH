# Implementation Backlog

## Purpose

Turn the DisasterPH upgrade roadmap into a delivery-oriented backlog that can be executed step by step without losing focus on reliability, clarity, and real-world usefulness.

## Epic List

1. Foundation
2. Awareness
3. Alerting
4. Resilience
5. Future Community Features

## Epic 1: Foundation

### Ticket F1: Establish Shared Severity Model

- Title: Establish shared severity model and color tokens
- Description: Define a single severity model for incident display and risk summaries, then apply it consistently across markers, badges, cards, alert bars, and saved-place summaries.
- User value: users can interpret urgency quickly and consistently across the entire product
- Technical notes:
  - create a shared severity mapping utility
  - define frontend design tokens for `safe`, `yellow`, `orange`, and `red`
  - keep source-specific mapping rules in shared logic rather than scattered UI conditionals
- Dependencies:
  - normalized incident model
- Priority: high
- Effort estimate: medium
- Acceptance criteria:
  - given an incident with a known severity mapping
  - when it is shown on the map, feed card, and detail panel
  - then each surface uses the same severity color and label
  - given a saved place affected by a warning-level incident
  - when the saved-place summary is rendered
  - then it uses the same severity model as the incident feed

### Ticket F2: Implement Source Health State Model

- Title: Implement source health state model and SLA rules
- Description: Formalize source states such as healthy, delayed, degraded, and unavailable, with explicit freshness thresholds and structured status metadata.
- User value: users can judge whether information is current and trustworthy during disruptions
- Technical notes:
  - define source freshness SLA per source
  - expose structured source status fields to the frontend
  - retain last successful fetch timestamps and reason notes
- Dependencies:
  - existing source fetch tracking
- Priority: high
- Effort estimate: medium
- Acceptance criteria:
  - given a source that has missed its freshness SLA
  - when the dashboard loads
  - then that source is shown as delayed or degraded with a visible last-updated time
  - given multiple sources with mixed health states
  - when the source health panel renders
  - then each source shows the correct status and freshness metadata

### Ticket F3: Add Last-Known Data Preservation And Stale UI

- Title: Preserve last-known data and show stale-state UI
- Description: Ensure source failures do not silently erase useful incident data and introduce explicit stale-state messaging across the app.
- User value: users retain access to useful information during partial outages instead of seeing misleading emptiness
- Technical notes:
  - preserve last successful incident data separately from current fetch status
  - add stale messaging to map context, feed states, and detail views
  - distinguish stale data from empty data
- Dependencies:
  - F2
- Priority: high
- Effort estimate: medium
- Acceptance criteria:
  - given a source outage after a successful prior fetch
  - when the app loads
  - then the last-known incidents remain visible with stale timestamps
  - given no active incidents but healthy sources
  - when the filtered view is empty
  - then the UI shows an empty state rather than a stale-state warning

### Ticket F4: Introduce API Caching And Retry Policy

- Title: Introduce API caching, retry policy, and fallback behavior
- Description: Add short-lived caching, safe revalidation, retry strategy, and clear fallback handling for source and incident endpoints.
- User value: the app stays responsive and more stable during temporary upstream slowness
- Technical notes:
  - use conservative stale-while-revalidate behavior
  - keep source health and incident caches separate
  - add retry backoff for backend source fetches
  - avoid presenting stale data as live data
- Dependencies:
  - F2
- Priority: high
- Effort estimate: medium
- Acceptance criteria:
  - given a temporary upstream timeout
  - when the backend retries according to policy
  - then the system records the retry attempt and either recovers or updates source health correctly
  - given a cached incident response and a fresh fetch in progress
  - when the user opens the app
  - then the user sees recent data quickly and receives updated freshness once revalidation completes

### Ticket F5: Unify Foundation UI States

- Title: Unify empty, stale, degraded, and unavailable UI states
- Description: Create shared UI patterns for no incidents, stale data, source degradation, and unavailable map or list data.
- User value: users can understand app state under stress without confusing generic errors
- Technical notes:
  - add reusable state components or patterns
  - keep copy calm, direct, and action-oriented
  - ensure the map-first layout remains intact in degraded conditions
- Dependencies:
  - F1
  - F2
  - F3
- Priority: high
- Effort estimate: small
- Acceptance criteria:
  - given a degraded source state
  - when the user views the dashboard
  - then the app shows a clear degraded-state message without collapsing into a broken layout
  - given a healthy filter with no matching incidents
  - when the user applies the filter
  - then the app shows a distinct empty state and not a source error state

## Epic 2: Awareness

### Ticket A1: Add Saved-Place Risk Summaries

- Title: Add saved-place risk summaries and nearest-incident logic
- Description: Build concise saved-place summaries that show the strongest nearby risk, nearest relevant incident, and source freshness.
- User value: users can quickly understand what matters for their own home, family, and frequent locations
- Technical notes:
  - start with distance and region-based matching
  - keep summaries compact and scannable
  - expose confidence limits when geometry is approximate
- Dependencies:
  - F1
  - F2
  - F3
- Priority: high
- Effort estimate: medium
- Acceptance criteria:
  - given a saved place within the configured proximity threshold of an active incident
  - when the saved-place panel loads
  - then the place shows the strongest relevant risk summary and nearest incident
  - given a saved place with no nearby active incidents
  - when the summary is rendered
  - then it shows a low-risk or no-active-incident state rather than an empty card

### Ticket A2: Improve Earthquake And Volcano Map Layers

- Title: Improve earthquake epicenter and volcano context visualization
- Description: Add clearer epicenter emphasis, compact magnitude/depth context, and volcano zone context without overwhelming the map.
- User value: users can understand seismic and volcanic risk spatially with less interpretation effort
- Technical notes:
  - use hazard-specific overlays
  - keep overlays lightweight for mobile
  - avoid fake precision when exclusion zones are approximate
- Dependencies:
  - F1
  - F5
- Priority: medium
- Effort estimate: medium
- Acceptance criteria:
  - given an earthquake incident
  - when it appears on the map
  - then the epicenter is visually clearer than a generic marker and its key metrics are available in compact form
  - given a volcano alert
  - when the map is displayed
  - then the user can distinguish the volcano context from other hazard types

### Ticket A3: Add Typhoon Track And Impact Path Visualization

- Title: Add typhoon track and projected impact path visualization
- Description: Introduce a simple, legible typhoon path layer and future-position awareness without turning the map into a cluttered weather chart.
- User value: users can understand movement and possible impact direction, not just current storm position
- Technical notes:
  - keep path visualization simple and performant
  - show confidence limits if the source supports them
  - preserve map readability on mobile
- Dependencies:
  - F1
  - F5
- Priority: medium
- Effort estimate: large
- Acceptance criteria:
  - given an active typhoon with track data
  - when the map loads
  - then the user can see the current position and a readable projected path
  - given limited or uncertain track data
  - when the overlay is shown
  - then the UI avoids implying precise certainty beyond the source data

### Ticket A4: Expand Place-Based Monitoring Rules

- Title: Expand place-based monitoring and hazard matching rules
- Description: Improve place relevance logic by combining region, radius, and hazard-specific thresholds.
- User value: saved-place summaries become more useful and less noisy
- Technical notes:
  - start simple and measurable
  - keep matching rules auditable
  - avoid expensive geospatial stacks at this stage
- Dependencies:
  - A1
- Priority: medium
- Effort estimate: medium
- Acceptance criteria:
  - given two saved places in different regions
  - when a hazard affects one region only
  - then only the relevant place receives a high-risk summary
  - given a distant low-impact incident
  - when place matching is computed
  - then it does not incorrectly dominate the place summary

## Epic 3: Alerting

### Ticket N1: Build Alert Eligibility And Dedupe Engine

- Title: Build alert eligibility, escalation, and dedupe engine
- Description: Create the backend logic that decides when an incident change should trigger a user-facing alert.
- User value: alerts become meaningful instead of repetitive or noisy
- Technical notes:
  - compare incident deltas
  - use severity and place matching
  - apply cool-down windows and dedupe keys
- Dependencies:
  - F1
  - F2
  - A4
- Priority: medium
- Effort estimate: large
- Acceptance criteria:
  - given an unchanged incident update from the source
  - when the alert engine evaluates it
  - then no duplicate alert is emitted
  - given an incident escalation from watch to warning near a saved place
  - when the engine evaluates it
  - then it creates an eligible alert event

### Ticket N2: Add Push Subscription And Preference Management

- Title: Add push subscription flow and user alert preferences
- Description: Allow users to opt into push notifications and configure which saved places and alert categories matter to them.
- User value: users receive useful alerts with more trust and less fatigue
- Technical notes:
  - support web push subscription lifecycle
  - store preferences per device or user context
  - request permission only after value is explained
- Dependencies:
  - N1
- Priority: medium
- Effort estimate: medium
- Acceptance criteria:
  - given a user who has not granted notification permission
  - when they enable alerts from a saved-place flow
  - then the app explains the alert value before requesting permission
  - given a subscribed user who disables a saved place
  - when alert preferences are updated
  - then future alerts for that place are not queued

### Ticket N3: Deliver Critical Saved-Place Push Notifications

- Title: Deliver critical saved-place push notifications
- Description: Send narrow, high-value notifications for severe incidents or escalations affecting saved places.
- User value: users receive timely warnings tied to places that matter to them
- Technical notes:
  - keep payloads compact
  - include place name, hazard type, and freshness context
  - log deliveries for debugging
- Dependencies:
  - N1
  - N2
- Priority: medium
- Effort estimate: medium
- Acceptance criteria:
  - given a critical incident affecting a subscribed saved place
  - when the alert engine emits a notification event
  - then a push notification is queued and delivered with the relevant place and hazard information
  - given a repeated source refresh with no meaningful change
  - when the delivery workflow runs
  - then no duplicate push is sent

## Epic 4: Resilience

### Ticket R1: Add App Shell PWA Support

- Title: Add installable app shell and service worker foundation
- Description: Introduce a minimal PWA setup focused on fast app shell loading and safe read-only behavior.
- User value: the app opens more reliably under poor network conditions
- Technical notes:
  - keep service worker scope conservative
  - cache shell assets only at first
  - avoid broad JSON caching until freshness behavior is proven
- Dependencies:
  - F4
  - F5
- Priority: medium
- Effort estimate: medium
- Acceptance criteria:
  - given a user who has previously loaded the app
  - when connectivity is weak or temporarily unavailable
  - then the app shell still opens
  - given a new deployment
  - when the service worker updates
  - then the app does not become stuck on stale shell assets

### Ticket R2: Add Cached Recent Alerts For Offline Viewing

- Title: Add cached recent alerts and offline fallback states
- Description: Cache a limited recent alert window and provide honest offline-state messaging.
- User value: users can still review recent alerts when connectivity fails during an emergency
- Technical notes:
  - cache a small, recent subset only
  - label all cached alerts as last-known
  - differentiate offline, stale, and degraded online states
- Dependencies:
  - R1
  - F3
- Priority: medium
- Effort estimate: medium
- Acceptance criteria:
  - given a user who previously loaded current alerts
  - when they reopen the app offline
  - then they can see cached recent alerts with visible last-updated timestamps
  - given no cached alerts are available
  - when the user is offline
  - then the app shows a clear offline-empty state instead of a generic failure

### Ticket R3: Add Offline Emergency Contacts Directory

- Title: Add offline emergency contacts and quick-dial directory
- Description: Provide a lightweight, cached directory for NDRRMC, Red Cross, and priority emergency hotlines.
- User value: users can still access essential contact information even when live data is unavailable
- Technical notes:
  - keep dataset small and easy to cache
  - expose direct call actions where device support exists
  - prefer national and high-confidence entries first
- Dependencies:
  - R1
- Priority: medium
- Effort estimate: small
- Acceptance criteria:
  - given a user who has loaded the app before going offline
  - when they open the emergency contacts area
  - then key contacts remain visible and usable offline
  - given a supported mobile device
  - when the user taps a hotline action
  - then the device call flow is triggered correctly

## Epic 5: Future Community Features

### Ticket C1: Define Community Reporting Trust And Moderation Model

- Title: Define community reporting trust, moderation, and privacy model
- Description: Design the rules and workflows required before any public crowdsourced reporting is introduced.
- User value: protects users from misinformation and unsafe feature rollout
- Technical notes:
  - define confidence tiers
  - define review workflow and abuse handling
  - define privacy and data minimization rules
- Dependencies:
  - all prior epics substantially complete
- Priority: low
- Effort estimate: medium
- Acceptance criteria:
  - given a proposed community report type
  - when the moderation model is reviewed
  - then there is a documented submission, review, publish, and abuse-response workflow
  - given a privacy review
  - when saved-place and community data are compared
  - then data minimization rules are explicitly defined

### Ticket C2: Prototype Internal Community Reporting Workflow

- Title: Prototype internal-only community reporting workflow
- Description: Build a limited internal prototype for blocked roads or flood reports without exposing it publicly.
- User value: validates usefulness and moderation workload before public release
- Technical notes:
  - no public publishing
  - no notification triggers
  - keep official and community data clearly separate
- Dependencies:
  - C1
- Priority: low
- Effort estimate: large
- Acceptance criteria:
  - given an internal tester submitting a report
  - when the report enters the system
  - then it is held in a review state and not shown as public official data
  - given a moderator reviewing the report
  - when the decision is recorded
  - then the workflow captures approve, reject, and reason outcomes

## Recommended Build Order

### First Wave

1. F1: Establish shared severity model
2. F2: Implement source health state model
3. F3: Add last-known data preservation and stale UI
4. F4: Introduce API caching and retry policy
5. A1: Add saved-place risk summaries
6. F5: Unify foundation UI states

This wave delivers the highest immediate value and aligns with the current priority: severity consistency, source health handling, caching and retry logic, and saved-place summaries.

### Second Wave

1. A2: Improve earthquake and volcano map layers
2. A3: Add typhoon track and impact path visualization
3. A4: Expand place-based monitoring rules

### Third Wave

1. N1: Build alert eligibility and dedupe engine
2. N2: Add push subscription and preference management
3. N3: Deliver critical saved-place push notifications

### Fourth Wave

1. R1: Add app shell PWA support
2. R2: Add cached recent alerts for offline viewing
3. R3: Add offline emergency contacts directory

### Fifth Wave

1. C1: Define community reporting trust and moderation model
2. C2: Prototype internal community reporting workflow

## What Can Be Parallelized

- F1 and F2 can run in parallel if shared naming and severity rules are aligned early
- F3 and F4 can partially overlap once the source health model is defined
- A2 and A3 can run in parallel after foundation stability is in place
- N2 can start while N1 is finishing if alert event contracts are already defined
- R3 can run in parallel with R2 after the service worker foundation exists

## What Should Stay Blocked

- A1 should wait for F1 through F3 because saved-place summaries depend on trusted severity and freshness
- N1 should wait for A4 because place matching must be stable before alert routing
- R2 should wait for F3 and R1 because cached alerts depend on honest stale-state presentation and service worker basics
- Community features should wait for all prior epics because they add the highest trust burden

## Risks And Blockers

- Government source instability may delay F2 through F4 if source contracts remain inconsistent
- Saved-place summaries can become noisy if matching rules in A1 and A4 are too broad
- Push alerts will fail user trust quickly if N1 ships before severity and stale handling are stable
- Service worker caching can create confusing stale behavior if R1 and R2 are implemented too aggressively
- Community features should be treated as optional until moderation capacity and privacy safeguards are credible
