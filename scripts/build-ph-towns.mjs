/**
 * Builds src/data/ph-towns.json: every city and municipality, its province,
 * and one point inside it (rounded to 2 decimals, about 1 km). Used to add a
 * saved place by name without sending what the visitor types anywhere.
 *
 * Source: faeldon/philippines-json-maps (MIT), the same dataset as the
 * region boundaries. Download into two folders:
 *   <provdists>: latest/geojson/regions/lowres/provdists-region-*.0.001.json (18 files)
 *   <municities>: latest/geojson/provdists/lowres/municities-provdist-*.0.001.json (88 files)
 * then run:
 *   node scripts/build-ph-towns.mjs <provdists> <municities>
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [provDir, townDir] = process.argv.slice(2);
if (!provDir || !townDir) {
  console.error("usage: node scripts/build-ph-towns.mjs <provdists folder> <municities folder>");
  process.exit(1);
}

const readAll = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((f) => JSON.parse(readFileSync(join(dir, f), "utf8")).features);

/** Readable province for districts and cities that are not provinces. */
function provinceLabel(name) {
  if (/^NCR\b/.test(name)) return "Metro Manila";
  if (/Special Geographic Area/i.test(name)) return "BARMM Special Geographic Area";
  if (/City of Isabela/i.test(name)) return "Basilan";
  return name.replace(/\s*\(Not a Province\)\s*$/i, "");
}

const provinces = new Map(readAll(provDir).map((f) => [f.properties.adm2_psgc, provinceLabel(f.properties.adm2_en)]));

function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return a / 2;
}

function ringCentroid(ring) {
  let a = 0, x = 0, y = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    a += f;
    x += (ring[j][0] + ring[i][0]) * f;
    y += (ring[j][1] + ring[i][1]) * f;
  }
  return a === 0 ? ring[0] : [x / (3 * a), y / (3 * a)];
}

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Midpoint of the widest stretch of land along the centroid's latitude. */
function scanlinePoint(ring, y) {
  const xs = [];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
  }
  xs.sort((a, b) => a - b);
  let best = null;
  for (let k = 0; k + 1 < xs.length; k += 2) {
    if (!best || xs[k + 1] - xs[k] > best[1] - best[0]) best = [xs[k], xs[k + 1]];
  }
  return best ? [(best[0] + best[1]) / 2, y] : ring[0];
}

/** A point inside the town's largest land polygon. */
function interiorPoint(geometry) {
  const polys = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const outer = polys.map((p) => p[0]).sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)))[0];
  const c = ringCentroid(outer);
  return inRing(c[0], c[1], outer) ? c : scanlinePoint(outer, c[1]);
}

const round2 = (n) => Math.round(n * 100) / 100;
const towns = [];
for (const f of readAll(townDir)) {
  const p = f.properties;
  if (!f.geometry) continue;
  const province = provinces.get(p.adm2_psgc);
  if (!province) throw new Error(`no province for ${p.adm3_en} (${p.adm2_psgc})`);
  const [lon, lat] = interiorPoint(f.geometry);
  towns.push([p.adm3_en, province, round2(lat), round2(lon)]);
}
towns.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));

writeFileSync(
  new URL("../src/data/ph-towns.json", import.meta.url),
  JSON.stringify({
    source: "faeldon/philippines-json-maps (MIT), PSGC",
    fields: ["name", "province", "lat", "lon"],
    towns,
  }) + "\n",
);
console.log(`${towns.length} towns written`);
