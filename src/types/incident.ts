export type IncidentSource = "EONET" | "PAGASA" | "PHIVOLCS";

export type IncidentEventType =
  | "typhoon"
  | "flood"
  | "earthquake"
  | "volcano"
  | "landslide"
  | "wildfire";

export type IncidentSeverity = "advisory" | "watch" | "warning" | "critical";

export type SourceHealthStatus = "healthy" | "delayed" | "degraded";

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

export interface SourceStatus {
  source: IncidentSource;
  status: SourceHealthStatus;
  last_fetch_at: string;
  latency_ms: number;
  notes: string;
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

export interface OfficialAdvisory {
  id: string;
  source: IncidentSource;
  title: string;
  summary: string;
  severity: IncidentSeverity;
  issued_at: string;
  url?: string;
}

export interface HelpAction {
  id: string;
  label: string;
  description: string;
  icon: "phone" | "share" | "checklist" | "locate" | "alert";
  href?: string;
}
