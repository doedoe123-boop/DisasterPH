import data from "@/data/ph-regions.json";

/**
 * Philippine region lookup from official PSGC region boundaries
 * (faeldon/philippines-json-maps, PSGC as of 31 Dec 2023, simplified to
 * ~1 km; see scripts/build-ph-regions.mjs).
 *
 * Points on land get the region they fall in. Offshore points are NOT
 * assigned a region: they are labelled "Offshore" (or "Offshore, near X"
 * within NEAR_KM of a region), and X is used only for alert matching.
 */

export const NEAR_KM = 100;

interface RegionShape {
  psgc: number;
  name: string;
  bbox: number[]; // [minLon, minLat, maxLon, maxLat]
  polygons: number[][][]; // polygon -> rings -> flat [lon, lat, ...]
}

const REGIONS = data.regions as RegionShape[];

export type RegionLocation =
  | { offshore: false; name: string; psgc: number }
  | { offshore: true; nearName: string | null; distanceKm: number | null };

function inRing(lon: number, lat: number, ring: number[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i], yi = ring[i + 1], xj = ring[j], yj = ring[j + 1];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function inPolygon(lon: number, lat: number, rings: number[][]): boolean {
  if (!inRing(lon, lat, rings[0])) return false;
  for (let h = 1; h < rings.length; h++) if (inRing(lon, lat, rings[h])) return false; // hole
  return true;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export function locateRegion(lat: number, lon: number): RegionLocation {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { offshore: true, nearName: null, distanceKm: null };
  }
  for (const r of REGIONS) {
    const [minLon, minLat, maxLon, maxLat] = r.bbox;
    if (lon < minLon || lon > maxLon || lat < minLat || lat > maxLat) continue;
    for (const poly of r.polygons) {
      if (inPolygon(lon, lat, poly)) return { offshore: false, name: r.name, psgc: r.psgc };
    }
  }

  // Offshore: nearest boundary vertex within ~NEAR_KM (bbox pre-filter ~1.2°).
  let best: { name: string; km: number } | null = null;
  const pad = 1.2;
  for (const r of REGIONS) {
    const [minLon, minLat, maxLon, maxLat] = r.bbox;
    if (lon < minLon - pad || lon > maxLon + pad || lat < minLat - pad || lat > maxLat + pad) continue;
    for (const poly of r.polygons) {
      const ring = poly[0];
      for (let i = 0; i < ring.length; i += 2) {
        const km = haversineKm(lat, lon, ring[i + 1], ring[i]);
        if (!best || km < best.km) best = { name: r.name, km };
      }
    }
  }
  if (best && best.km <= NEAR_KM) {
    return { offshore: true, nearName: best.name, distanceKm: Math.round(best.km) };
  }
  return { offshore: true, nearName: null, distanceKm: best ? Math.round(best.km) : null };
}

/** Display label: region name, "Offshore, near X", or "Offshore". */
export function regionLabel(loc: RegionLocation): string {
  if (!loc.offshore) return loc.name;
  return loc.nearName ? `Offshore, near ${loc.nearName}` : "Offshore";
}

/** Region used for alert/region matching (land region or nearest region), or null. */
export function matchingRegion(loc: RegionLocation): string | null {
  return loc.offshore ? loc.nearName : loc.name;
}

export const REGION_NAMES: readonly string[] = REGIONS.map((r) => r.name);

/** Localized display of a region label (region names themselves are official names). */
export function displayRegion(region: string, locale: "en" | "fil"): string {
  if (locale !== "fil") return region;
  if (region === "Offshore") return "Sa dagat";
  const near = /^Offshore, near (.+)$/.exec(region);
  return near ? `Sa dagat, malapit sa ${near[1]}` : region;
}
