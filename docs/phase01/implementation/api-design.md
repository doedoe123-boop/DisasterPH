# API Design

## Principles

- Resource-oriented JSON responses
- Normalized incident payload regardless of source
- Explicit source freshness metadata
- Easy filtering by event type and region

## Endpoints

### `GET /api/incidents`

Query params:

- `type`
- `region`
- `severity`
- `source`

Example response:

```json
{
  "data": [
    {
      "id": "phi-001",
      "source": "PAGASA",
      "external_id": "TCWS-LP-2026-04-04-01",
      "event_type": "typhoon",
      "title": "Tropical Cyclone Wind Signal monitoring near Eastern Samar",
      "description": "Low-pressure system intensifying east of Samar.",
      "latitude": 11.85,
      "longitude": 125.42,
      "severity": "warning",
      "region": "Eastern Visayas",
      "started_at": "2026-04-04T01:10:00+08:00",
      "updated_at": "2026-04-04T08:18:00+08:00",
      "metadata": {
        "wind_kph": 65
      }
    }
  ],
  "meta": {
    "count": 1,
    "filters": {
      "type": "typhoon"
    },
    "generated_at": "2026-04-04T08:20:00+08:00"
  }
}
```

### `GET /api/incidents/{id}`

- Returns one normalized incident and any recent history or advisory links.

### `GET /api/sources/health`

- Returns source status, last fetch timestamp, latency, and stale flags.

### `GET /api/stats/overview`

- Returns counts for active alerts, severe alerts, regions tracked, and sources online.

## Versioning

- Start with `/api/v1/*` once the Laravel API exists.
- Keep the frontend mock route unversioned only during the prototype stage.
