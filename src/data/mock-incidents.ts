import type {
  Incident,
  SourceStatus,
  WatchedPlace,
  OfficialAdvisory,
  HelpAction,
} from "@/types/incident";

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

export const mockWatchedPlaces: WatchedPlace[] = [
  {
    id: "wp-001",
    label: "Lola's house",
    region: "Eastern Visayas",
    latitude: 11.25,
    longitude: 124.96,
    activeHazards: 1,
    highestSeverity: "warning",
  },
  {
    id: "wp-002",
    label: "Family in Batangas",
    region: "CALABARZON",
    latitude: 13.76,
    longitude: 121.06,
    activeHazards: 2,
    highestSeverity: "watch",
  },
  {
    id: "wp-003",
    label: "Ate's place",
    region: "Cagayan Valley",
    latitude: 17.61,
    longitude: 121.73,
    activeHazards: 1,
    highestSeverity: "watch",
  },
];

export const mockAdvisories: OfficialAdvisory[] = [
  {
    id: "adv-001",
    source: "PAGASA",
    title: "Severe Weather Bulletin #3 — Low Pressure Area",
    summary:
      "PAGASA warns of heavy to intense rainfall over Eastern Visayas and Bicol Region in the next 24 hours. Residents in flood- and landslide-prone areas should take precautions.",
    severity: "warning",
    issued_at: "2026-04-04T06:00:00+08:00",
  },
  {
    id: "adv-002",
    source: "PHIVOLCS",
    title: "Taal Volcano Bulletin — Alert Level 1",
    summary:
      "Taal Volcano remains at Alert Level 1. Entry into the main crater is prohibited. Communities within the 7-km radius should remain vigilant.",
    severity: "warning",
    issued_at: "2026-04-04T05:30:00+08:00",
  },
  {
    id: "adv-003",
    source: "PHIVOLCS",
    title: "Earthquake Information — Batangas",
    summary:
      "A magnitude 5.6 earthquake struck west of Batangas at 6:17 AM. No tsunami threat. Aftershocks are expected.",
    severity: "watch",
    issued_at: "2026-04-04T06:48:00+08:00",
  },
];

export const mockHelpActions: HelpAction[] = [
  {
    id: "help-001",
    label: "Emergency Hotlines",
    description: "NDRRMC, Red Cross, local rescue",
    icon: "phone",
    actionType: "call",
    href: "tel:+6328911-1406",
  },
  {
    id: "help-002",
    label: "Share This Area",
    description: "Send hazard info to family",
    icon: "share",
    actionType: "share",
  },
  {
    id: "help-003",
    label: "Safety Checklist",
    description: "Prepare for this hazard type",
    icon: "checklist",
    actionType: "internal",
  },
  {
    id: "help-004",
    label: "Nearest Evacuation",
    description: "Find shelters and routes",
    icon: "locate",
    actionType: "internal",
  },
  {
    id: "help-005",
    label: "Request Help",
    description: "Report your situation",
    icon: "alert",
    actionType: "internal",
  },
];
