#!/usr/bin/env node
/**
 * Build public/map/ph-outline.json, the map's fallback base: a plain outline
 * of the Philippines and its regions, shown when the base map (OpenFreeMap)
 * cannot load, for example offline. The service worker stores it, so it works
 * without a connection.
 *
 * Source: src/data/ph-regions.json (faeldon/philippines-json-maps, MIT
 * License; PSGC as of 31 Dec 2023; already simplified to ~1 km). Coordinates
 * are rounded to 3 decimals (~100 m), well below that simplification.
 *
 * Usage: node scripts/build-ph-outline.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("..", import.meta.url);
const regions = JSON.parse(readFileSync(new URL("src/data/ph-regions.json", root), "utf8"));

const round = (v) => Math.round(v * 1000) / 1000;
function ring(flat) {
  const out = [];
  for (let i = 0; i < flat.length; i += 2) {
    const p = [round(flat[i]), round(flat[i + 1])];
    const last = out[out.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p);
  }
  const [a, b] = [out[0], out[out.length - 1]];
  if (a[0] !== b[0] || a[1] !== b[1]) out.push(a);
  return out;
}

const features = regions.regions.map((r) => ({
  type: "Feature",
  properties: { region: r.name },
  geometry: {
    type: "MultiPolygon",
    coordinates: r.polygons.map((rings) => rings.map(ring).filter((x) => x.length >= 4)).filter((p) => p.length > 0),
  },
}));

const out = {
  type: "FeatureCollection",
  // Kept with the data so the attribution travels with it.
  source: regions.source,
  license: regions.license,
  psgcAsOf: regions.psgcAsOf,
  features,
};
mkdirSync(new URL("public/map/", root), { recursive: true });
const file = new URL("public/map/ph-outline.json", root);
writeFileSync(file, JSON.stringify(out));
console.log(`wrote ${fileURLToPath(file)}: ${features.length} regions, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
