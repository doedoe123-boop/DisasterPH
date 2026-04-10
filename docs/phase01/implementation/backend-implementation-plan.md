# Backend Implementation Plan

## Laravel Modules / Folders

- `app/Actions/Incidents`
- `app/Fetchers`
- `app/Transformers`
- `app/Jobs`
- `app/Notifications`
- `app/Services/Alerts`
- `app/Http/Controllers/Api`
- `app/Models`

## Jobs

- `IngestEonetEventsJob`
- `IngestPagasaAdvisoriesJob`
- `IngestPhivolcsBulletinsJob`
- `EvaluateIncidentAlertsJob`
- `UpdateSourceHealthJob`

## Scheduler Flow

- Every 5 minutes: fetch PAGASA advisories
- Every 2 minutes: fetch PHIVOLCS latest earthquake listings
- Every 10 minutes: refresh volcano bulletins
- Every 15 minutes: refresh EONET reference events
- Every minute: evaluate stale-source thresholds

## Queue Usage

- `ingestion` queue for source fetch and transform
- `alerts` queue for notification fan-out
- `maintenance` queue for source health and cleanup

## Notification Flow

1. Ingestion upserts normalized incident
2. Change detector computes delta
3. Alert engine determines whether the update is actionable
4. Notification records are created with dedupe keys
5. Channel-specific jobs deliver outbound messages

## Dedupe Strategy

- Unique constraint on `source + external_id`
- Content hash to detect meaningful payload changes
- Channel-level dedupe key to prevent repeat sends

## Error Handling and Stale Source Handling

- Retry transient failures with exponential backoff
- Mark sources `delayed` after first missed SLA
- Mark sources `degraded` after repeated failures
- Surface stale timestamps in the dashboard rather than hiding data
