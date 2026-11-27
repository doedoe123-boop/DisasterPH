import data from "@/data/ph-provinces.json";
import regionData from "@/data/ph-regions.json";

/**
 * Province -> region lookup for text such as PAGASA wind-signal areas
 * ("Batanes and the northeastern portion of Babuyan Islands", "Northern
 * Samar, the northern portion of Samar (Calbayog City)").
 */

interface ProvinceRecord {
  name: string;
  psgc: number;
  regionPsgc: number;
}

const REGION_BY_PSGC = new Map<number, string>(
  (regionData as { regions: Array<{ psgc: number; name: string }> }).regions.map((r) => [r.psgc, r.name]),
);

/** Names PAGASA uses for islands and areas that are part of a province. */
const ALIASES: Record<string, string> = {
  "Metro Manila": "@National Capital Region",
  "Babuyan Islands": "Cagayan",
  "Babuyan Is.": "Cagayan",
  "Polillo Islands": "Quezon",
  "Burias Island": "Masbate",
  "Ticao Island": "Masbate",
  "Calamian Islands": "Palawan",
  "Cuyo Islands": "Palawan",
  "Kalayaan Islands": "Palawan",
  "Cagayancillo": "Palawan",
  "Camotes Islands": "Cebu",
  "Bantayan Islands": "Cebu",
  "Siargao Islands": "Surigao del Norte",
  "Bucas Grande Islands": "Surigao del Norte",
  "Lubang Island": "Occidental Mindoro",
  "Compostela Valley": "Davao de Oro",
  "Mt. Province": "Mountain Province",
  "Maguindanao": "@BARMM",
  // Cities whose names contain a different province's name.
  "Quezon City": "@National Capital Region",
  "Cotabato City": "@BARMM",
  "Isabela City": "@BARMM",
  "Davao City": "@Davao Region",
  "Zamboanga City": "@Zamboanga Peninsula",
  // PHIVOLCS tsunami bulletins list "CITY OF GENERAL SANTOS" (in South Cotabato's area).
  "City of General Santos": "South Cotabato",
  "General Santos City": "South Cotabato",
  "General Santos": "South Cotabato",
};

export interface ProvinceMatch {
  /** Province (or alias target) named in the text. */
  province: string;
  region: string;
}

interface Pattern {
  term: string;
  province: string;
  region: string;
}

const PATTERNS: Pattern[] = (() => {
  const provinces = (data as { provinces: ProvinceRecord[] }).provinces;
  const byName = new Map(provinces.map((p) => [p.name, p]));
  const out: Pattern[] = provinces.map((p) => ({
    term: p.name,
    province: p.name,
    region: REGION_BY_PSGC.get(p.regionPsgc) ?? "",
  }));
  for (const [term, target] of Object.entries(ALIASES)) {
    if (target.startsWith("@")) {
      out.push({ term, province: term, region: target.slice(1) });
    } else {
      const p = byName.get(target);
      if (p) out.push({ term, province: p.name, region: REGION_BY_PSGC.get(p.regionPsgc) ?? "" });
    }
  }
  // Longest first, so "Southern Leyte" wins over "Leyte" and "South
  // Cotabato" over "Cotabato".
  return out.filter((p) => p.region).sort((a, b) => b.term.length - a.term.length);
})();

function escape(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Provinces (and their regions) named in free text, in order of appearance. */
export function findProvinces(text: string): ProvinceMatch[] {
  let rest = ` ${text} `;
  const found: Array<ProvinceMatch & { at: number }> = [];
  for (const p of PATTERNS) {
    const re = new RegExp(`(?<![A-Za-z])${escape(p.term)}(?![A-Za-z])`, "gi");
    rest = rest.replace(re, (match, offset: number) => {
      found.push({ province: p.province, region: p.region, at: offset });
      // Mask the match so shorter names inside it don't match again.
      return " ".repeat(match.length);
    });
  }
  const seen = new Set<string>();
  return found
    .sort((a, b) => a.at - b.at)
    .filter((f) => !seen.has(f.province) && seen.add(f.province))
    .map(({ province, region }) => ({ province, region }));
}

/** Distinct regions named in free text. */
export function findRegions(text: string): string[] {
  return [...new Set(findProvinces(text).map((m) => m.region))];
}
