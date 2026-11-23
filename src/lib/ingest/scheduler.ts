import {
  upsertIncidents,
  replaceSourceIncidents,
  clearSource,
  getIncidents,
  recordFetch,
  getLastRefresh,
  setLastRefresh,
} from "./store";
import type { Incident } from "@/types/incident";
import { fetchEonetEvents } from "./eonet";
import { EQ_MIN_MAGNITUDE, EQ_WINDOW_DAYS, fetchPhivolcsEvents } from "./phivolcs";
import { fetchUsgsEvents } from "./usgs";
import { BULLETIN_STALE_MS, fetchPhivolcsVolcanoes } from "./phivolcs-volcano";
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
        ingestEarthquakes(),
        ingestVolcanoes(),
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

const EQ_WINDOW_MS = EQ_WINDOW_DAYS * 86_400_000;

/** "2026-11" in Philippine Time. */
function phtMonth(ms: number): string {
  return new Date(ms + 8 * 3_600_000).toISOString().slice(0, 7);
}

/** Same quake reported by two agencies: within 2 minutes and ~100 km. */
export function sameQuake(a: Incident, b: Incident): boolean {
  const dt = Math.abs(new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
  if (dt > 120_000) return false;
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h)) <= 100;
}

/**
 * Earthquakes come from PHIVOLCS. If its page cannot be fetched or parsed,
 * the last PHIVOLCS events stay up and the USGS catalogue fills the gap,
 * labelled as USGS, skipping quakes PHIVOLCS already reported. Once PHIVOLCS
 * works again, the USGS records and status are dropped.
 */
/** Earthquake fetchers; replaceable in tests. */
export const earthquakeFetchers = {
  phivolcs: fetchPhivolcsEvents,
  usgs: fetchUsgsEvents,
};

/** Volcano alert levels; replaceable in tests. */
export const volcanoFetchers = { phivolcs: fetchPhivolcsVolcanoes };

/**
 * PHIVOLCS volcano alert levels, reported under their own status entry
 * ("PHIVOLCS_VOLCANO"). On failure the last known levels stay up; each one
 * shows its bulletin date, so it never looks fresher than it is.
 */
async function ingestVolcanoes(): Promise<void> {
  const start = Date.now();
  try {
    const { events, note } = await volcanoFetchers.phivolcs();
    replaceSourceIncidents("PHIVOLCS", events, { eventType: "volcano" });
    recordFetch({
      source: "PHIVOLCS_VOLCANO",
      fetched_at: new Date().toISOString(),
      success: true,
      latency_ms: Date.now() - start,
      event_count: events.length,
      note,
    });
  } catch (error) {
    // Keep the last known levels, but let them age: re-flag stale bulletins.
    const now = Date.now();
    const kept = getIncidents()
      .filter((i) => i.source === "PHIVOLCS" && i.event_type === "volcano")
      .map((i) => {
        const date = i.metadata.bulletin_date;
        const issued = typeof date === "string" ? Date.parse(`${date}T00:00:00+08:00`) : NaN;
        const stale = !Number.isFinite(issued) || now - issued > BULLETIN_STALE_MS;
        return { ...i, metadata: { ...i.metadata, bulletin_stale: stale } };
      });
    replaceSourceIncidents("PHIVOLCS", kept, { eventType: "volcano" });
    recordFetch({
      source: "PHIVOLCS_VOLCANO",
      fetched_at: new Date().toISOString(),
      success: false,
      latency_ms: Date.now() - start,
      event_count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function ingestEarthquakes(): Promise<void> {
  const start = Date.now();
  try {
    const events = await earthquakeFetchers.phivolcs();
    const now = Date.now();
    replaceSourceIncidents("PHIVOLCS", events, {
      eventType: "earthquake",
      // The PHIVOLCS page lists only the current month; keep last month's
      // quakes (still within the window) after the month rolls over.
      keep: (inc) => phtMonth(new Date(inc.started_at).getTime()) !== phtMonth(now),
      maxAgeMs: EQ_WINDOW_MS,
    }, now);
    clearSource("USGS");
    recordFetch({
      source: "PHIVOLCS",
      fetched_at: new Date().toISOString(),
      success: true,
      latency_ms: Date.now() - start,
      event_count: events.length,
      note: `${events.length} earthquakes of magnitude ${EQ_MIN_MAGNITUDE.toFixed(1)} or higher in the last ${EQ_WINDOW_DAYS} days (PHIVOLCS).`,
    });
    return;
  } catch (error) {
    recordFetch({
      source: "PHIVOLCS",
      fetched_at: new Date().toISOString(),
      success: false,
      latency_ms: Date.now() - start,
      event_count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const fallbackStart = Date.now();
  try {
    const phivolcs = getIncidents().filter((i) => i.source === "PHIVOLCS");
    const events = (await earthquakeFetchers.usgs()).filter(
      (u) => !phivolcs.some((p) => sameQuake(p, u)),
    );
    replaceSourceIncidents("USGS", events, { eventType: "earthquake", maxAgeMs: EQ_WINDOW_MS });
    recordFetch({
      source: "USGS",
      fetched_at: new Date().toISOString(),
      success: true,
      latency_ms: Date.now() - fallbackStart,
      event_count: events.length,
      note: "Temporary fallback while PHIVOLCS is unavailable. USGS catalogue, not an official Philippine source.",
    });
  } catch (error) {
    recordFetch({
      source: "USGS",
      fetched_at: new Date().toISOString(),
      success: false,
      latency_ms: Date.now() - fallbackStart,
      event_count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
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
