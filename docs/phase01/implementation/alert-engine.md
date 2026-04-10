# Alert Engine

## Goal

Turn normalized incident updates into actionable notifications without spamming operators or subscribers.

## Evaluation Inputs

- Incident severity
- Hazard type
- Region
- Source trust level
- Incident freshness
- Change delta compared with the last stored version

## Trigger Examples

- New `warning` or `critical` incident
- Escalation from `watch` to `warning`
- Major metadata change such as stronger winds or larger magnitude
- Source outage that exceeds stale thresholds

## Dedupe Rules

- Build a dedupe key from `source + external_id + severity + region`
- Ignore unchanged payloads by storing a normalized hash
- Collapse rapid repeated upstream updates into a cool-down window

## Notification Channels

- Internal operations dashboard
- Email
- SMS
- Webhook

## Safety Guardrails

- Treat EONET as reference-only unless confirmed by operational sources
- Suppress notifications when a source is degraded and payload confidence is low
- Record why each alert fired for auditing
