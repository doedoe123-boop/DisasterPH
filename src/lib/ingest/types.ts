export interface FetchLog {
  source: string;
  fetched_at: string;
  success: boolean;
  latency_ms: number;
  event_count: number;
  error?: string;
}

export interface SourceHealthRecord {
  source: string;
  status: "healthy" | "delayed" | "degraded" | "offline";
  last_success_at: string | null;
  last_fetch_at: string | null;
  latency_ms: number;
  consecutive_failures: number;
  notes: string;
}
