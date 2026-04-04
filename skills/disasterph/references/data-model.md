# Data Model

## Normalized Event Schema

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

## Required Fields

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

## Source-Specific Transformers

- `EonetEventTransformer`
- `PagasaEventTransformer`
- `PhivolcsEventTransformer`

Each transformer should convert raw upstream data into the normalized event schema without leaking source-specific structure into the rest of the app.

## Severity Logic

- Base severity on source semantics, explicit bulletin levels, and domain-specific thresholds
- Preserve a common severity ladder across all sources
- Do not promote EONET events to operational certainty without stronger confirmation

## Stale Data Rules

- Record per-source `last_fetch_at`, `status`, and latency
- Mark sources `delayed` when freshness misses the defined SLA
- Mark sources `degraded` after repeated failures or long staleness
- Keep stale incidents visible with stale context instead of silently removing them

## Dedupe Strategy

- Unique identity should start with `source + external_id`
- Maintain a normalized content hash to detect meaningful change
- Suppress repeated alerts when the payload is materially unchanged

## Region Grouping

- Store a human-readable `region`
- Prefer Philippine administrative or commonly understood regional groupings
- Support higher-level groupings such as Luzon, Visayas, and Mindanao when useful for filtering or analytics
