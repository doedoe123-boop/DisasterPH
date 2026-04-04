import {
  upsertIncidents,
  recordFetch,
  getLastRefresh,
  setLastRefresh,
} from "./store";
import { fetchEonetEvents } from "./eonet";
import { fetchPhivolcsEvents } from "./phivolcs";
import { fetchPagasaEvents } from "./pagasa";

/** Cache TTL: 3 min in prod, 30 s in dev. */
const CACHE_TTL_MS =
  process.env.NODE_ENV === "production" ? 3 * 60_000 : 30_000;

let refreshing = false;

/**
 * Called from API route handlers.
 * If the in-memory cache is stale, fetches all sources in parallel.
 */
export async function ensureFreshData(): Promise<void> {
  const now = Date.now();
  if (now - getLastRefresh() < CACHE_TTL_MS) return;
  if (refreshing) return;

  refreshing = true;
  try {
    await Promise.allSettled([
      ingestSource("PHIVOLCS", fetchPhivolcsEvents),
      ingestSource("PAGASA", fetchPagasaEvents),
      ingestSource("EONET", fetchEonetEvents),
    ]);
    setLastRefresh(now);
  } finally {
    refreshing = false;
  }
}

async function ingestSource(
  name: string,
  fetcher: () => Promise<unknown[]>,
): Promise<void> {
  const start = Date.now();
  try {
    const events = await fetcher();
    const latency = Date.now() - start;
    upsertIncidents(events as never[]);
    recordFetch({
      source: name,
      fetched_at: new Date().toISOString(),
      success: true,
      latency_ms: latency,
      event_count: events.length,
    });
  } catch (error) {
    recordFetch({
      source: name,
      fetched_at: new Date().toISOString(),
      success: false,
      latency_ms: Date.now() - start,
      event_count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
