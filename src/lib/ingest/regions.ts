/** Rough Philippine region estimation from lat/lon. */
export function estimateRegion(lat: number, lon: number): string {
  if (lat > 18) return "Cordillera Administrative Region";
  if (lat > 16 && lon < 121) return "Ilocos Region";
  if (lat > 16) return "Cagayan Valley";
  if (lat > 14.5 && lon < 121) return "Central Luzon";
  if (lat > 14 && lon < 121.5) return "National Capital Region";
  if (lat > 13 && lon < 122) return "CALABARZON";
  if (lat > 12 && lon > 123) return "Eastern Visayas";
  if (lat > 12) return "Bicol Region";
  if (lat > 10 && lon < 123) return "Western Visayas";
  if (lat > 10) return "Central Visayas";
  if (lat > 8) return "Northern Mindanao";
  if (lat > 6 && lon > 125) return "Caraga";
  if (lat > 6) return "Davao Region";
  return "BARMM";
}

/** Philippines bounding box. */
export const PH_BOUNDS = {
  minLat: 4.5,
  maxLat: 21.5,
  minLon: 116.0,
  maxLon: 127.5,
} as const;
