import type { Incident, SourceStatus } from "@/types/incident";

export const mockIncidents: Incident[] = [
  {
    id: "phi-001",
    source: "PAGASA",
    external_id: "TCWS-LP-2026-04-04-01",
    event_type: "typhoon",
    title: "Tropical Cyclone Wind Signal monitoring near Eastern Samar",
    description:
      "Low-pressure system intensifying east of Samar with heavy rain bands moving toward Eastern Visayas.",
    latitude: 11.85,
    longitude: 125.42,
    severity: "warning",
    region: "Eastern Visayas",
    started_at: "2026-04-04T01:10:00+08:00",
    updated_at: "2026-04-04T08:18:00+08:00",
    metadata: {
      wind_kph: 65,
      rainfall_mm: 118,
      bulletin: "Weather Advisory No. 3",
    },
  },
  {
    id: "phi-002",
    source: "PHIVOLCS",
    external_id: "EQ-2026-0404-0617",
    event_type: "earthquake",
    title: "Magnitude 5.6 offshore event west of Batangas",
    description:
      "Moderate offshore earthquake detected. No tsunami warning issued. Aftershock monitoring is ongoing.",
    latitude: 13.62,
    longitude: 120.41,
    severity: "watch",
    region: "CALABARZON",
    started_at: "2026-04-04T06:17:00+08:00",
    updated_at: "2026-04-04T06:48:00+08:00",
    metadata: {
      magnitude: 5.6,
      depth_km: 24,
      felt_intensity: "IV",
    },
  },
  {
    id: "phi-003",
    source: "PHIVOLCS",
    external_id: "VOLC-TAAL-2026-0404",
    event_type: "volcano",
    title: "Taal sulfur dioxide plume remains elevated",
    description:
      "Degassing activity remains above baseline. Communities around the main crater should continue to avoid the permanent danger zone.",
    latitude: 14.0,
    longitude: 120.99,
    severity: "warning",
    region: "CALABARZON",
    started_at: "2026-04-03T21:00:00+08:00",
    updated_at: "2026-04-04T07:55:00+08:00",
    metadata: {
      alert_level: 1,
      so2_tpd: 2841,
    },
  },
  {
    id: "phi-004",
    source: "EONET",
    external_id: "EONET-9825",
    event_type: "flood",
    title: "Flooding cluster across lower Cagayan basin",
    description:
      "Satellite-observed flood signatures indicate river swelling in low-lying municipalities after sustained rainfall.",
    latitude: 17.62,
    longitude: 121.73,
    severity: "watch",
    region: "Cagayan Valley",
    started_at: "2026-04-03T14:30:00+08:00",
    updated_at: "2026-04-04T05:40:00+08:00",
    metadata: {
      confidence: "visual-reference",
      note: "For situational awareness, not operational dispatch.",
    },
  },
  {
    id: "phi-005",
    source: "PAGASA",
    external_id: "RAINFALL-2026-BICOL-11",
    event_type: "landslide",
    title: "Rain-induced landslide risk in Albay upland barangays",
    description:
      "Persistent moderate to heavy rain raises slope failure risk in saturated upland communities.",
    latitude: 13.21,
    longitude: 123.68,
    severity: "warning",
    region: "Bicol Region",
    started_at: "2026-04-04T02:25:00+08:00",
    updated_at: "2026-04-04T08:02:00+08:00",
    metadata: {
      rainfall_mm: 156,
      trigger: "orographic rain",
    },
  },
  {
    id: "phi-006",
    source: "PHIVOLCS",
    external_id: "EQ-2026-0404-0114",
    event_type: "earthquake",
    title: "Magnitude 4.2 event near Surigao del Sur",
    description:
      "Light tremor recorded in Surigao del Sur. No major damage reports received as of latest bulletin.",
    latitude: 8.99,
    longitude: 126.06,
    severity: "advisory",
    region: "Caraga",
    started_at: "2026-04-04T01:14:00+08:00",
    updated_at: "2026-04-04T01:44:00+08:00",
    metadata: {
      magnitude: 4.2,
      depth_km: 11,
    },
  },
];

export const mockSourceStatuses: SourceStatus[] = [
  {
    source: "PAGASA",
    status: "healthy",
    last_fetch_at: "2026-04-04T08:20:00+08:00",
    latency_ms: 1230,
    notes: "Public weather advisories parsed successfully.",
  },
  {
    source: "PHIVOLCS",
    status: "healthy",
    last_fetch_at: "2026-04-04T08:16:00+08:00",
    latency_ms: 880,
    notes: "Earthquake and volcano bulletin sync current.",
  },
  {
    source: "EONET",
    status: "delayed",
    last_fetch_at: "2026-04-04T07:10:00+08:00",
    latency_ms: 4120,
    notes: "Reference feed is available but operating outside dispatch SLA.",
  },
];
