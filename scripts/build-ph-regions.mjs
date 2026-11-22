#!/usr/bin/env node
/**
 * Build src/data/ph-regions.json from the faeldon/philippines-json-maps
 * low-resolution country GeoJSON (MIT License; PSGC as of 31 Dec 2023):
 *
 *   https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/latest/geojson/country/lowres/country.0.001.json
 *
 * Usage: node scripts/build-ph-regions.mjs <path-to-country.0.001.json>
 *
 * Simplifies each ring (Douglas-Peucker, 0.01° ≈ 1 km), rounds to 4
 * decimals, and maps PSGC region codes to the region names DisasterPH
 * already uses (stored in users' alert preferences, so they must not change).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TOLERANCE = 0.01;
const NAMES = {
  100000000: "Ilocos Region",
  200000000: "Cagayan Valley",
  300000000: "Central Luzon",
  400000000: "CALABARZON",
  500000000: "Bicol Region",
  600000000: "Western Visayas",
  700000000: "Central Visayas",
  800000000: "Eastern Visayas",
  900000000: "Zamboanga Peninsula",
  1000000000: "Northern Mindanao",
  1100000000: "Davao Region",
  1200000000: "SOCCSKSARGEN",
  1300000000: "National Capital Region",
  1400000000: "Cordillera Administrative Region",
  1600000000: "Caraga",
  1700000000: "MIMAROPA",
  1800000000: "Negros Island Region",
  1900000000: "BARMM",
};

const input = process.argv[2];
if (!input) {
  console.error("usage: node scripts/build-ph-regions.mjs <country.0.001.json>");
  process.exit(2);
}
const geo = JSON.parse(readFileSync(input, "utf8"));
if (geo.type !== "FeatureCollection") throw new Error("expected a FeatureCollection");

function perpDist(p, a, b) {
  const [x, y] = p, [x1, y1] = a, [x2, y2] = b;
  const dx = x2 - x1, dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}
function simplify(points, tol) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let max = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDist(points[i], points[s], points[e]);
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol && idx > 0) { keep[idx] = 1; stack.push([s, idx], [idx, e]); }
  }
  return points.filter((_, i) => keep[i]);
}
const round = (n) => Math.round(n * 1e4) / 1e4;

let pointsIn = 0, pointsOut = 0;
const regions = geo.features.map((f) => {
  const psgc = f.properties.adm1_psgc;
  const name = NAMES[psgc];
  if (!name) throw new Error(`unmapped PSGC region ${psgc} (${f.properties.adm1_en})`);
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  let minLon = 180, minLat = 90, maxLon = -180, maxLat = -90;
  const polygons = polys.map((rings) =>
    rings.map((ring) => {
      pointsIn += ring.length;
      let s = simplify(ring, TOLERANCE);
      if (s.length < 4) s = ring; // keep tiny islands rather than dropping them
      const flat = [];
      for (const [lon, lat] of s) {
        flat.push(round(lon), round(lat));
        minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
        minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
      }
      pointsOut += s.length;
      return flat;
    }),
  );
  return { psgc, psgcName: f.properties.adm1_en, name, bbox: [minLon, minLat, maxLon, maxLat].map(round), polygons };
});

const out = {
  source: "https://github.com/faeldon/philippines-json-maps (latest/geojson/country/lowres/country.0.001.json)",
  license: "MIT License, Copyright (c) James Faeldon",
  psgcAsOf: "2023-12-31",
  simplification: `Douglas-Peucker ${TOLERANCE} degrees, coordinates rounded to 4 decimals`,
  regions,
};
const dest = fileURLToPath(new URL("../src/data/ph-regions.json", import.meta.url));
writeFileSync(dest, JSON.stringify(out));
console.log(`regions: ${regions.length}, points ${pointsIn} -> ${pointsOut}, wrote ${dest}`);
