import {
  upsertIncidents,
  recordFetch,
  getLastRefresh,
  setLastRefresh,
} from "./store";
import type { Incident } from "@/types/incident";
import { fetchEonetEvents } from "./eonet";
import { fetchPhivolcsEvents } from "./phivolcs";
import { fetchPagasaEvents, type SourceFetchResult } from "./pagasa";

/** Cache TTL: 3 min in prod, 30 s in dev. */
const CACHE_TTL_MS =
  process.env.NODE_ENV === "production" ? 3 * 60_000 : 30_000;

let inFlight: Promise<void> | null = null;

/**
 * Called from API route handlers.
 * If the in-memory cache is stale, fetches all sources in parallel.
 *
 * Until the first refresh has completed, concurrent callers wait for it, so
 * they never report a source as "awaiting first fetch" while it is merely
 * slower than the others. Afterwards, callers during a refresh get the last
 * known data immediately.
 */
export async function ensureFreshData(): Promise<void> {
  const now = Date.now();
  if (now - getLastRefresh() < CACHE_TTL_MS) return;

  if (inFlight) {
    if (getLastRefresh() === 0) await inFlight;
    return;
  }

  inFlight = (async () => {
    try {
      await Promise.allSettled([
        ingestSource("PHIVOLCS", fetchPhivolcsEvents),
        ingestSource("PAGASA", fetchPagasaEvents),
        ingestSource("EONET", fetchEonetEvents),
      ]);
      setLastRefresh(now);
    } finally {
      inFlight = null;
    }
  })();
  await inFlight;
}

async function ingestSource(
  name: string,
  fetcher: () => Promise<Incident[] | SourceFetchResult>,
): Promise<void> {
  const start = Date.now();
  try {
    const result = await fetcher();
    const { events, ...extra }: Partial<SourceFetchResult> & { events: Incident[] } =
      Array.isArray(result) ? { events: result } : result;
    const latency = Date.now() - start;
    upsertIncidents(events);
    recordFetch({
      source: name,
      fetched_at: new Date().toISOString(),
      success: true,
      latency_ms: latency,
      event_count: events.length,
      ...(extra.note && { note: extra.note }),
      ...(extra.bulletin_state && { bulletin_state: extra.bulletin_state }),
      ...(extra.uncertain && { uncertain: true }),
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
