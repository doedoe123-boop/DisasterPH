import {
  locateRegion,
  matchingRegion,
  regionLabel,
  type RegionLocation,
} from "@/lib/geo/ph-regions";

/**
 * Display region for a point, from official PSGC region boundaries.
 * Offshore points are labelled "Offshore" / "Offshore, near X" instead of
 * being assigned a region.
 */
export function estimateRegion(lat: number, lon: number): string {
  return regionLabel(locateRegion(lat, lon));
}

/**
 * Region used for matching (saved places, alert region filters): the land
 * region, or for offshore points the nearest region within 100 km.
 */
export function regionForMatching(lat: number, lon: number): string {
  const loc = locateRegion(lat, lon);
  return matchingRegion(loc) ?? regionLabel(loc);
}

/** Region metadata to store on an incident. */
export function regionMetadata(lat: number, lon: number): {
  region: string;
  metadata: { offshore: boolean; near_region: string | null; region_psgc: number | null };
} {
  const loc: RegionLocation = locateRegion(lat, lon);
  return {
    region: regionLabel(loc),
    metadata: {
      offshore: loc.offshore,
      near_region: loc.offshore ? loc.nearName : null,
      region_psgc: loc.offshore ? null : loc.psgc,
    },
  };
}

/** Philippines bounding box. */
export const PH_BOUNDS = {
  minLat: 4.5,
  maxLat: 21.5,
  minLon: 116.0,
  maxLon: 127.5,
} as const;
