import type { Incident, SavedPlace } from "@/types/incident";
import { haversineKm } from "@/lib/risk-summary";
import { regionForMatching } from "@/lib/ingest/regions";

/**
 * Volcano danger zones and the saved-place line on the event card. Runs in
 * the browser only: saved places never leave the device.
 *
 * Wording rules (map handoff): never "safe" or "not affected". A place
 * outside a zone is "outside the danger zone", always with "This is not a
 * safety confirmation." Distances are approximate: saved places are stored
 * to about 1 km.
 */

/**
 * The Permanent Danger Zone radius PHIVOLCS gives in the bulletin (e.g. 4 km,
 * 6 km), or 0 when there is none (Taal's PDZ is the whole volcano island):
 * no radius, no circle, no inside/outside verdict.
 */
export function pdzRadiusKm(incident: Incident): number {
  if (incident.event_type !== "volcano") return 0;
  const km = Number(incident.metadata?.pdz_radius_km);
  return Number.isFinite(km) && km > 0 && km <= 30 ? km : 0;
}

/**
 * The zone outline: points exactly `radiusKm` from the centre along great
 * circles (same sphere, R = 6371 km, as `haversineKm`), so the drawn edge and
 * the inside/outside line on the card agree. Closed ring of [lon, lat].
 */
export function zoneRing(lat: number, lon: number, radiusKm: number, steps = 64): [number, number][] {
  const R = 6371;
  const rad = Math.PI / 180;
  const d = radiusKm / R;
  const lat1 = lat * rad;
  const lon1 = lon * rad;
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const bearing = ((i % steps) / steps) * 2 * Math.PI;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing));
    const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    ring.push([lon2 / rad, lat2 / rad]);
  }
  return ring;
}

/** Saved places are rounded to ~1 km; within this of the edge we say "near the edge". */
export const EDGE_MARGIN_KM = 1.5;
/** Saved places listed on a volcano card: within this distance of the summit. */
export const VOLCANO_PLACE_KM = 50;
/** Saved places listed on an earthquake card: within this distance of the epicentre. */
export const QUAKE_PLACE_KM = 100;
const MAX_PLACES = 5;

export type PlaceRelation =
  | "inside" // inside the volcano's Permanent Danger Zone
  | "edge" // within ~1.5 km of its edge (locations are approximate)
  | "outside" // outside the zone
  | "near" // distance only (no zone radius, or an earthquake)
  | "signal"; // the place's region is under one of the cyclone's PAGASA wind signals

export interface PlaceCheck {
  place: SavedPlace;
  /** Rounded to whole km (at least 1). Null for wind-signal matches. */
  distanceKm: number | null;
  relation: PlaceRelation;
  /** Region name for wind-signal matches. */
  region?: string;
}

/** Saved places relevant to this event, nearest first (at most 5). */
export function placeChecks(incident: Incident, places: SavedPlace[]): PlaceCheck[] {
  if (places.length === 0) return [];
  if (incident.event_type === "typhoon") {
    const regions = typeof incident.metadata.signal_regions === "string" ? incident.metadata.signal_regions.split("|") : [];
    if (regions.length === 0) return [];
    return places
      .map((place) => ({ place, region: regionForMatching(place.latitude, place.longitude) }))
      .filter((p) => regions.includes(p.region))
      .slice(0, MAX_PLACES)
      .map((p) => ({ place: p.place, distanceKm: null, relation: "signal" as const, region: p.region }));
  }
  const limit = incident.event_type === "volcano" ? VOLCANO_PLACE_KM : incident.event_type === "earthquake" ? QUAKE_PLACE_KM : 0;
  if (limit === 0) return [];
  const radius = pdzRadiusKm(incident);
  return places
    .map((place) => ({ place, d: haversineKm(place.latitude, place.longitude, incident.latitude, incident.longitude) }))
    .filter((p) => p.d <= limit)
    .sort((a, b) => a.d - b.d)
    .slice(0, MAX_PLACES)
    .map(({ place, d }): PlaceCheck => {
      let relation: PlaceRelation = "near";
      if (radius > 0) {
        if (Math.abs(d - radius) <= EDGE_MARGIN_KM) relation = "edge";
        else relation = d < radius ? "inside" : "outside";
      }
      return { place, distanceKm: Math.max(1, Math.round(d)), relation };
    });
}
