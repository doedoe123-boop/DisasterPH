/**
 * Builds src/data/ph-provinces.json: every province and the region it
 * belongs to (PSGC), used to match PAGASA wind-signal areas to regions.
 *
 * Source: faeldon/philippines-json-maps (MIT), the same dataset as the
 * region boundaries. Download the 18 files
 *   https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/latest/geojson/regions/lowres/provdists-region-<PSGC>.0.001.json
 * into one folder, then run:
 *   node scripts/build-ph-provinces.mjs <folder>
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: node scripts/build-ph-provinces.mjs <folder with provdists-region-*.json>");
  process.exit(1);
}

const provinces = [];
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const geo = JSON.parse(readFileSync(join(dir, file), "utf8"));
  for (const feature of geo.features) {
    const p = feature.properties;
    // NCR districts, independent cities and the BARMM Special Geographic
    // Area are not provinces; PAGASA names them differently (see aliases in
    // src/lib/geo/ph-provinces.ts).
    if (/Not a Province|Special Geographic Area/i.test(p.adm2_en)) continue;
    provinces.push({ name: p.adm2_en, psgc: p.adm2_psgc, regionPsgc: p.adm1_psgc });
  }
}
provinces.sort((a, b) => a.psgc - b.psgc);
writeFileSync(
  new URL("../src/data/ph-provinces.json", import.meta.url),
  JSON.stringify({ source: "faeldon/philippines-json-maps (MIT), PSGC", provinces }, null, 1) + "\n",
);
console.log(`${provinces.length} provinces written`);
