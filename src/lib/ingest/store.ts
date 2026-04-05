import type {
  Incident,
  OfficialAdvisory,
  SourceStatus,
} from "@/types/incident";
import type { FetchLog, SourceHealthRecord } from "./types";

/* ── Module-level storage (persists across requests in same process) ── */

const incidents = new Map<string, Incident>();
let fetchLogs: FetchLog[] = [];
const sourceHealth = new Map<string, SourceHealthRecord>();
let lastRefresh = 0;

const STALE_MS = 5 * 60_000;
const DELAYED_MS = 15 * 60_000;

/* ── Incidents ── */

export function getIncidents(): Incident[] {
  return Array.from(incidents.values()).sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
}

export function getIncidentById(id: string): Incident | undefined {
  return incidents.get(id);
}

export function upsertIncidents(batch: Incident[]): number {
  let added = 0;
  for (const inc of batch) {
    const key = `${inc.source}:${inc.external_id}`;
    const existing = incidents.get(key);
    if (
      !existing ||
      new Date(inc.updated_at).getTime() >
        new Date(existing.updated_at).getTime()
    ) {
      incidents.set(key, { ...inc, id: key });
      added++;
    }
  }
  return added;
}

/* ── Fetch logging & source health ── */

export function recordFetch(log: FetchLog): void {
  fetchLogs.push(log);
  if (fetchLogs.length > 100) fetchLogs = fetchLogs.slice(-100);

  const prev: SourceHealthRecord = sourceHealth.get(log.source) ?? {
    source: log.source,
    status: "offline",
    last_success_at: null,
    last_fetch_at: null,
    latency_ms: 0,
    consecutive_failures: 0,
    notes: "Initializing…",
  };

  prev.last_fetch_at = log.fetched_at;
  prev.latency_ms = log.latency_ms;

  if (log.success) {
    prev.last_success_at = log.fetched_at;
    prev.consecutive_failures = 0;
    prev.notes = `Fetched ${log.event_count} event${log.event_count !== 1 ? "s" : ""} successfully.`;
    const age = Date.now() - new Date(log.fetched_at).getTime();
    prev.status =
      age < STALE_MS ? "healthy" : age < DELAYED_MS ? "delayed" : "degraded";
  } else {
    prev.consecutive_failures++;
    prev.notes = log.error ?? "Fetch failed.";
    prev.status = prev.consecutive_failures >= 3 ? "offline" : "degraded";
  }

  sourceHealth.set(log.source, prev);
}

export function getSourceHealth(): SourceStatus[] {
  const out: SourceStatus[] = [];

  for (const [, h] of sourceHealth) {
    let status = h.status;
    if (h.last_success_at) {
      const age = Date.now() - new Date(h.last_success_at).getTime();
      if (age > DELAYED_MS && status === "healthy") status = "delayed";
      else if (age > DELAYED_MS * 2) status = "degraded";
    }
    out.push({
      source: h.source as SourceStatus["source"],
      status: (status === "offline"
        ? "degraded"
        : status) as SourceStatus["status"],
      last_fetch_at: h.last_fetch_at ?? new Date().toISOString(),
      latency_ms: h.latency_ms,
      notes: h.notes,
    });
  }

  // Guarantee all three sources appear
  for (const src of ["PAGASA", "PHIVOLCS", "EONET"] as const) {
    if (!out.find((s) => s.source === src)) {
      out.push({
        source: src,
        status: "unavailable",
        last_fetch_at: new Date().toISOString(),
        latency_ms: 0,
        notes: "Awaiting first fetch.",
      });
    }
  }
  return out;
}

/* ── Advisories (derived from PAGASA + PHIVOLCS incidents) ── */

export function getAdvisories(): OfficialAdvisory[] {
  return Array.from(incidents.values())
    .filter((i) => i.source === "PAGASA" || i.source === "PHIVOLCS")
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 20)
    .map((i) => ({
      id: `adv-${i.id}`,
      source: i.source,
      title: i.title,
      summary: i.description,
      severity: i.severity,
      issued_at: i.updated_at,
      url: typeof i.metadata.url === "string" ? i.metadata.url : undefined,
    }));
}

/* ── Cache helpers ── */

export function getLastRefresh(): number {
  return lastRefresh;
}

export function setLastRefresh(ts: number): void {
  lastRefresh = ts;
}

export function getFetchLogs(): FetchLog[] {
  return [...fetchLogs];
}
