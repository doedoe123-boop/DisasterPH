# Stage 3: Alerting

## Objective

Introduce active warning delivery in a way that is useful, trusted, and not fatiguing.

## Why This Stage Comes After Foundation And Awareness

Push notifications amplify both strengths and mistakes. If severity, place matching, or stale handling are weak, notifications will create confusion and distrust quickly.

## Scope

### Push Notifications

- Web push for high-priority alerts
- Support browser opt-in on mobile and desktop where available
- Start with a narrow, high-value scope:
  - critical incidents
  - major escalation events
  - saved-place impacts

### Alert Triggers

- New severe incident near a saved place
- Escalation from advisory to watch, or watch to warning
- Material typhoon track change affecting a saved place
- Significant earthquake near a saved place
- Source recovery notices only if operationally justified and not noisy

### Saved-Place-Based Alerts

- Users should receive alerts tied to their chosen places, not every national event
- Keep matching logic transparent:
  - which place was affected
  - which hazard triggered the alert
  - when the source was last updated

### Escalation Rules

- Trigger only on meaningful severity or proximity changes
- Apply quiet dedupe windows to avoid repeated notifications
- Handle repeated source updates carefully so the same incident does not spam users
- Allow a limited number of alert categories at first

### Notification UX And Opt-In Logic

- Ask for notification permission only after clear value is shown
- Explain:
  - what will trigger alerts
  - which places are monitored
  - how often users may hear from the app
- Provide clear preference controls
- Avoid dark-pattern permission prompts

## Dependencies

- Stage 1 severity and stale logic
- Stage 2 saved-place model and place matching
- Backend change detection and dedupe
- Notification service integration

## Technical Considerations

- Web push support varies across browsers and devices
- VAPID key management and subscription lifecycle must be handled carefully
- Notification payloads should remain compact and action-oriented
- Store delivery logs for debugging and trust analysis

## Tradeoffs

- Start with fewer alert types to avoid fatigue
- It is better to miss low-value alerts than to over-notify and lose user trust
- Place-based alerts are more useful than broad national blasts for most users

## Recommended Acceptance Criteria

- Users can opt in with clear expectations
- Notifications fire for meaningful changes only
- Saved-place alerts are understandable and traceable to incident data
- The app has dedupe and escalation guardrails before launch
