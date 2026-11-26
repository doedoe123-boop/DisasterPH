/** "USGS" appears only as a labelled fallback when PHIVOLCS is unavailable. */
export type IncidentSource = "EONET" | "PAGASA" | "PHIVOLCS" | "USGS";

export type IncidentEventType =
  | "typhoon"
  | "flood"
  | "earthquake"
  | "volcano"
  | "landslide"
  | "wildfire";

export type IncidentSeverity = "advisory" | "watch" | "warning" | "critical";

export type SourceHealthStatus =
  | "healthy"
  | "delayed"
  | "degraded"
  | "unavailable";

export type SeverityTone = "safe" | "yellow" | "orange" | "red";

export interface Incident {
  id: string;
  source: IncidentSource;
  external_id: string;
  event_type: IncidentEventType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: IncidentSeverity;
  region: string;
  started_at: string;
  updated_at: string;
  metadata: Record<string, string | number | boolean | null>;
}

/** Status entries: one per incident source, plus PHIVOLCS volcano bulletins
 *  (their incidents are published as "PHIVOLCS") and PAGASA rainfall and
 *  flood warnings (published as "PAGASA", event type "flood"). */
export type SourceKey = IncidentSource | "PHIVOLCS_VOLCANO" | "PAGASA_RAIN";

export interface SourceStatus {
  source: SourceKey;
  status: SourceHealthStatus;
  last_fetch_at: string;
  /** Last successful fetch (null if none yet). */
  last_success_at?: string | null;
  latency_ms: number;
  notes: string;
  /** PAGASA only: what the official bulletin page says about tropical cyclones. */
  bulletin_state?: "none" | "active" | "unknown";
  /** PAGASA rainfall/flood only: the national Weather Advisory in effect (null: none). */
  weather_advisory?: { number: number; url: string } | null;
}

export interface DashboardStats {
  activeAlerts: number;
  criticalAlerts: number;
  sourcesOnline: number;
  regionsTracked: number;
}

export interface WatchedPlace {
  id: string;
  label: string;
  region: string;
  latitude: number;
  longitude: number;
  activeHazards: number;
  highestSeverity: IncidentSeverity | null;
}

export interface SavedPlace {
  id: string;
  label: string;
  /** e.g. "home", "work", "family", "school" */
  tag: "home" | "work" | "family" | "school" | "other";
  latitude: number;
  longitude: number;
  /** Free-text note, e.g. "Lola's house" */
  note?: string;
  /** Where it is, in words, e.g. "Guiuan, Eastern Samar" */
  locality?: string;
  createdAt: string;
}

export interface PlaceRiskSummary {
  place: SavedPlace;
  nearbyIncidents: Incident[];
  monitoredIncidents: Incident[];
  highestSeverity: IncidentSeverity | null;
  /** Distance to nearest incident in km */
  nearestDistanceKm: number | null;
  /** "none" means no matching event, which is not the same as safe. */
  riskLevel: "none" | "monitor" | "at-risk" | "danger";
  strongestIncident: Incident | null;
  freshestUpdateAt: string | null;
  placeRegion: string;
  matchingSummary: string;
}

export interface OfficialAdvisory {
  id: string;
  source: IncidentSource;
  title: string;
  summary: string;
  severity: IncidentSeverity;
  issued_at: string;
  url?: string;
}

/** A single point along a typhoon's observed or forecast track */
export interface TyphoonTrackPoint {
  lat: number;
  lon: number;
  /** ISO timestamp */
  time: string;
  /** Whether this is a forecast (true) or observed (false) point */
  forecast: boolean;
  /** Sustained wind speed in kph at this point, if known */
  windSpeedKph?: number;
}

export interface HelpAction {
  id: string;
  label: string;
  description: string;
  icon: "phone" | "share" | "checklist" | "locate" | "alert" | "link" | "copy";
  actionType: "call" | "link" | "share" | "copy" | "internal";
  href?: string;
  /** For copy actions, the text to copy */
  copyText?: string;
}

export type AlertTrigger =
  | "new-warning"
  | "new-critical"
  | "escalation"
  | "new-place-impact";

export interface AlertEvent {
  id: string;
  dedupeKey: string;
  incidentId: string;
  incidentTitle: string;
  incidentSeverity: IncidentSeverity;
  incidentRegion: string;
  trigger: AlertTrigger;
  placeIds: string[];
  placeLabels: string[];
  generatedAt: string;
  updatedAt: string;
  message: string;
}

export interface AlertSnapshot {
  incidentId: string;
  severity: IncidentSeverity;
  placeIds: string[];
  updatedAt: string;
}

// ── Community Reports (C2 internal prototype) ──

export type ReportCategory =
  | "blocked_road"
  | "flooding"
  | "landslide"
  | "power_outage"
  | "evacuation"
  | "damage"
  | "other";

export type ReportStatus = "pending" | "approved" | "rejected";

export interface CommunityReport {
  id: string;
  category: ReportCategory;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationLabel: string;
  status: ReportStatus;
  /** Submitted by the reporter; only returned to moderators, never public. */
  reporterName?: string;
  createdAt: string;
  updatedAt: string;
  moderatedAt?: string;
  moderatedBy?: string;
  moderationReason?: string;
}
