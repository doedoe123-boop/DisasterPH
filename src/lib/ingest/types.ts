export interface FetchLog {
  source: string;
  fetched_at: string;
  success: boolean;
  latency_ms: number;
  event_count: number;
  error?: string;
  /** Source-specific note (replaces the generic "Fetched N events"). */
  note?: string;
  bulletin_state?: "none" | "active" | "unknown";
  /** Fetched but could not be interpreted with confidence. */
  uncertain?: boolean;
}

export interface SourceHealthRecord {
  source: string;
  status: "healthy" | "delayed" | "degraded" | "offline";
  last_success_at: string | null;
  last_fetch_at: string | null;
  latency_ms: number;
  consecutive_failures: number;
  notes: string;
  bulletin_state?: "none" | "active" | "unknown";
}
