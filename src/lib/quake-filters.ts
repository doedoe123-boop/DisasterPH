import type { Incident } from "@/types/incident";

/**
 * Earthquake filters for the home map and list. They apply to earthquakes
 * only: volcano alert levels and active tropical cyclones are current
 * statuses and are never hidden by a time or magnitude filter.
 */

export const QUAKE_RANGES = [
  { key: "1h", hours: 1 },
  { key: "6h", hours: 6 },
  { key: "24h", hours: 24 },
  { key: "48h", hours: 48 },
  { key: "7d", hours: 168 },
] as const;
export type QuakeRange = (typeof QUAKE_RANGES)[number]["key"];
export const DEFAULT_QUAKE_RANGE: QuakeRange = "24h";

/** Shown by default; smaller quakes (the feed starts at M3.0) on request. */
export const DEFAULT_MIN_MAGNITUDE = 3.5;
export const SMALLEST_LISTED_MAGNITUDE = 3.0;

export function rangeHours(range: QuakeRange): number {
  return QUAKE_RANGES.find((r) => r.key === range)?.hours ?? 24;
}

/** Does this event pass the earthquake filters? Non-earthquakes always do. */
export function passesQuakeFilters(
  incident: Incident,
  range: QuakeRange,
  includeSmall: boolean,
  now: number = Date.now(),
): boolean {
  if (incident.event_type !== "earthquake") return true;
  const time = Date.parse(incident.started_at || incident.updated_at);
  if (!Number.isFinite(time) || now - time > rangeHours(range) * 3_600_000) return false;
  const mag = Number(incident.metadata.magnitude);
  // Unknown magnitude: keep it (never hide an event because a field is missing).
  if (!Number.isFinite(mag)) return true;
  return includeSmall || mag >= DEFAULT_MIN_MAGNITUDE;
}

/** Hours since the quake (for fading older markers). */
export function ageHours(incident: Incident, now: number = Date.now()): number {
  const time = Date.parse(incident.started_at || incident.updated_at);
  return Number.isFinite(time) ? Math.max(0, (now - time) / 3_600_000) : 0;
}

/** Map layers a reader can switch on and off. */
export type LayerKey = "earthquake" | "volcano" | "typhoon" | "flood" | "other";
export const LAYER_KEYS: LayerKey[] = ["earthquake", "volcano", "typhoon", "flood", "other"];

export function layerOf(incident: Incident): LayerKey {
  if (incident.event_type === "earthquake" || incident.event_type === "volcano" || incident.event_type === "typhoon") {
    return incident.event_type;
  }
  // PAGASA rainfall warnings and river basins; NASA EONET floods stay "other".
  if (incident.event_type === "flood" && incident.source === "PAGASA") return "flood";
  return "other";
}
