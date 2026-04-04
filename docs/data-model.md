# Data Model

## Normalized Incident

```ts
interface Incident {
  id: string;
  source: "EONET" | "PAGASA" | "PHIVOLCS";
  external_id: string;
  event_type:
    | "typhoon"
    | "flood"
    | "earthquake"
    | "volcano"
    | "landslide"
    | "wildfire";
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: "advisory" | "watch" | "warning" | "critical";
  region: string;
  started_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}
```

## Supporting Tables

### `incidents`

- `id`
- `source`
- `external_id`
- `event_type`
- `title`
- `description`
- `latitude`
- `longitude`
- `severity`
- `region`
- `started_at`
- `updated_at`
- `metadata`
- `source_hash`
- `first_seen_at`
- `last_seen_at`

### `source_fetch_runs`

- `id`
- `source`
- `started_at`
- `completed_at`
- `status`
- `http_status`
- `latency_ms`
- `records_seen`
- `records_written`
- `error_message`

### `notifications`

- `id`
- `incident_id`
- `channel`
- `recipient_key`
- `status`
- `sent_at`
- `dedupe_key`

## Severity Guidance

- `advisory`: informational but worth displaying
- `watch`: conditions indicate elevated risk
- `warning`: likely or ongoing impact
- `critical`: highest-priority national attention

## Source Nuance

- `PAGASA` and `PHIVOLCS` are operationally authoritative for their domains.
- `EONET` is reference metadata for visualization and general awareness.
