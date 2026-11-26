import type { Incident, IncidentSeverity } from "@/types/incident";
import { findProvinces } from "@/lib/geo/ph-provinces";
import towns from "@/data/ph-towns.json";
import { parseIssuedAt } from "./pagasa";

/*
 * PAGASA rainfall and flood information. PAGASA publishes no feed for these,
 * so the official pages are read (formats checked against live pages on
 * 2026-11-26 and archived pages from active events: NCR Heavy Rainfall
 * Warning No. 29 of 25 July 2024, the flood page and Weather Advisory No. 29
 * of 22 July 2025):
 *
 * 1. Regional forecast pages of the five PAGASA Regional Services Divisions
 *    (PRSD), "Rainfall Warning" tab: the latest Heavy Rainfall Warning (RED /
 *    ORANGE / YELLOW warning levels with provinces and PAGASA's associated
 *    hazard) or Rainfall Advisory, or "As of today, there is no Heavy
 *    Rainfall Warning Issued."
 * 2. The flood page: status of the 18 major river basins and 4 dam
 *    sub-basins ("Non-Flood Watch", "Flood Watch", ...), linking to a basin
 *    page or PDF bulletin.
 * 3. The Weather Advisory page: number, cause ("FOR:") and issue time of the
 *    national advisory, or "As of today, there is no Weather Advisory issued."
 *
 * All wording shown to people (levels, areas, hazards, advice, statuses) is
 * PAGASA's, copied as published. What is ours: the severity label per level,
 * the marker position (middle of the listed provinces) and which provinces a
 * river basin covers (BASIN_PROVINCES, from general geography, not PAGASA).
 */

const BASE = "https://www.pagasa.dost.gov.ph";
export const PAGASA_FLOOD_URL = `${BASE}/flood`;
export const PAGASA_WEATHER_ADVISORY_URL = `${BASE}/weather/weather-advisory`;
const USER_AGENT = "DisasterPH/1.0 (disaster information; warning status check)";

/** The five Regional Services Divisions and their forecast pages. */
export const PRSD_PAGES = [
  { key: "nlprsd", url: `${BASE}/regional-forecast/nlprsd` },
  { key: "ncrprsd", url: `${BASE}/regional-forecast/ncrprsd` },
  { key: "slprsd", url: `${BASE}/regional-forecast/slprsd` },
  { key: "visprsd", url: `${BASE}/regional-forecast/visprsd` },
  { key: "minprsd", url: `${BASE}/regional-forecast/minprsd` },
] as const;

/** A shown warning older than this is flagged as possibly out of date
 *  (PAGASA issues the next one within about 3 hours). */
export const RAIN_STALE_MS = 4 * 3_600_000;
/** A warning older than this is not shown at all. */
export const RAIN_MAX_AGE_MS = 24 * 3_600_000;

/* ── Text helpers ── */

function stripNoise(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&amp;/gi, "&");
}

/** HTML -> lines of plain text (one per <br>, paragraph or block). */
function htmlLines(html: string): string[] {
  return decode(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** Only PAGASA-hosted https links (pages and pubfiles). */
function pagasaLink(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, `${BASE}/`);
    if (url.protocol === "http:" && /(^|\.)pagasa\.dost\.gov\.ph$/.test(url.hostname)) url.protocol = "https:";
    return url.protocol === "https:" && /(^|\.)pagasa\.dost\.gov\.ph$/.test(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Parenthesised town lists ("Quezon(General Nakar, Infanta)") name towns,
 *  some of which share a province's name; only the province before them counts. */
function provinceText(text: string): string {
  return text.replace(/\([^)]*\)/g, " ");
}

/* ── Regional rainfall warnings and advisories ── */

export type RainLevelName = "RED" | "ORANGE" | "YELLOW";

export interface RainLevel {
  level: RainLevelName;
  /** As published: "Zambales and Bataan" */
  areas: string;
  /** As published: "FLOODING is still THREATENING." */
  hazard: string | null;
}

export interface RainProduct {
  kind: "warning" | "advisory";
  number: number | null;
  /** "NCR_PRSD" (from the "#NCR_PRSD" tag) */
  office: string | null;
  weatherSystem: string | null;
  issuedAt: string;
  levels: RainLevel[];
  /** Other lines as published ("Meanwhile, expect ...", advisory areas). */
  body: string[];
  /** "The public and the Disaster Risk Reduction and Management Offices concerned are advised to ..." */
  advice: string | null;
}

export type RainPageState = "none" | "active" | "unknown";

const PRODUCT_HEADER = /^(Heavy Rainfall Warning|Rainfall Advisory)\s*No\.?\s*(\d+)?\s*(#\S+)?/i;

export function parseRegionalRain(html: string): { state: RainPageState; product: RainProduct | null } {
  const clean = stripNoise(html);
  const start = clean.indexOf('id="rainfalls"');
  if (start < 0) return { state: "unknown", product: null };
  // End before the thunderstorm tab's own opening tag ("<div id=...").
  const next = clean.indexOf('id="thunderstorms"', start);
  const end = next > start ? clean.lastIndexOf("<", next) : start + 40_000;
  const lines = htmlLines(clean.slice(clean.indexOf(">", start) + 1, end));

  const products: RainProduct[] = [];
  let cur: (RainProduct & { pendingLevel?: RainLevel }) | null = null;
  let unreadable = false;
  const finish = () => {
    if (!cur) return;
    if (cur.issuedAt) products.push(cur);
    else unreadable = true;
    cur = null;
  };
  for (const line of lines) {
    const header = line.match(PRODUCT_HEADER);
    if (header) {
      finish();
      cur = {
        kind: /warning/i.test(header[1]) ? "warning" : "advisory",
        number: header[2] ? Number(header[2]) : null,
        office: header[3] ? header[3].replace(/^#/, "") : null,
        weatherSystem: null,
        issuedAt: "",
        levels: [],
        body: [],
        advice: null,
      };
      continue;
    }
    if (!cur) continue;
    const c: RainProduct = cur;
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^Weather System:\s*(.+)$/i))) c.weatherSystem = m[1].trim();
    else if ((m = line.match(/^Issued at:\s*(.+)$/i))) c.issuedAt = parseIssuedAt(m[1]) ?? "";
    else if ((m = line.match(/^(RED|ORANGE|YELLOW) WARNING LEVEL:\s*(.+?)\.?$/i)))
      c.levels.push({ level: m[1].toUpperCase() as RainLevelName, areas: m[2].trim(), hazard: null });
    else if ((m = line.match(/^ASSOCIATED HAZARD:\s*(.+)$/i))) {
      const last = c.levels[c.levels.length - 1];
      if (last && !last.hazard) last.hazard = m[1].trim();
    } else if (/advised to/i.test(line) && !c.advice) c.advice = line;
    else if (/^For more information/i.test(line)) continue;
    else c.body.push(line);
  }
  finish();

  if (products.length === 0) {
    if (/there is no Heavy Rainfall Warning Issued/i.test(lines.join(" ")) && !unreadable) return { state: "none", product: null };
    return { state: "unknown", product: null };
  }
  // The newest first on the page; pick by issue time to be sure.
  const latest = products.reduce((a, b) => (Date.parse(b.issuedAt) > Date.parse(a.issuedAt) ? b : a));
  return { state: "active", product: latest };
}

/* ── River basins ── */

export interface BasinStatus {
  name: string;
  /** As published: "Non-Flood Watch", "Flood Watch", ... */
  status: string;
  url: string | null;
}

/** Rows of the basin and dam tables on the flood page. Throws if the tables are missing. */
export function parseBasins(html: string): BasinStatus[] {
  const clean = stripNoise(html);
  const start = clean.indexOf("18 MAJOR RIVER BASINS");
  if (start < 0) throw new Error("PAGASA flood page: river basin table not found");
  const end = clean.indexOf("General Flood Advisory", start);
  const tables = clean.slice(start, end > start ? end : start + 40_000);
  const rows: BasinStatus[] = [];
  for (const row of tables.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
    if (cells.length < 2) continue;
    const name = decode(cells[0].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    const status = decode(cells[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    const href = cells[1].match(/href=['"]([^'"]+)['"]/i)?.[1];
    if (name && status) rows.push({ name, status, url: pagasaLink(href) });
  }
  if (rows.length < 18) throw new Error(`PAGASA flood page: only ${rows.length} basin rows read`);
  return rows;
}

export function isNormalBasinStatus(status: string): boolean {
  return /^non-flood/i.test(status.trim());
}

export interface BasinPage {
  issuedAt: string | null;
  observedRain: string | null;
  forecastRain: string | null;
  forecastWater: string | null;
}

/** A basin's own page (/flood/<basin>): issue time and PAGASA's three statements. */
export function parseBasinPage(html: string): BasinPage {
  const lines = htmlLines(stripNoise(html));
  const after = (re: RegExp) => {
    const i = lines.findIndex((l) => re.test(l));
    return i >= 0 && lines[i + 1] && !/:$/.test(lines[i + 1]) ? lines[i + 1] : null;
  };
  const issued = lines.find((l) => /^ISSUED AT/i.test(l));
  const m = issued?.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*,?\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
  return {
    issuedAt: m ? parseIssuedAt(`${m[1]}, ${m[2]}`) : null,
    observedRain: after(/^OBSERVED 24-HR RAINFALL/i),
    forecastRain: after(/^FORECAST 24-HR RAINFALL/i),
    forecastWater: after(/^FORECAST WATER LEVEL/i),
  };
}

/**
 * Provinces each basin mainly covers. NOT from PAGASA (its pages do not list
 * them): DisasterPH's own lookup from general geography, used only to place
 * the marker and match "your area". Verify before relying on it.
 */
export const BASIN_PROVINCES: Readonly<Record<string, string[]>> = {
  "Pampanga": ["Pampanga", "Bulacan", "Nueva Ecija", "Tarlac"],
  "Agno": ["Pangasinan", "Benguet", "Tarlac"],
  "Bicol": ["Camarines Sur", "Albay", "Camarines Norte"],
  "Cagayan": ["Cagayan", "Isabela", "Nueva Vizcaya", "Quirino"],
  "NCR/Pasig Marikina Laguna de Bay": ["Metro Manila", "Rizal", "Laguna"],
  "Abra": ["Abra", "Ilocos Sur"],
  "Cagayan De Oro": ["Misamis Oriental", "Bukidnon"],
  "Ilog-Hilabangan": ["Negros Occidental"],
  "Jalaur": ["Iloilo"],
  "Panay": ["Capiz"],
  "Tagum-Libuganon": ["Davao del Norte", "Davao de Oro"],
  "Apayao-Abulug": ["Apayao", "Cagayan"],
  "Agusan": ["Agusan del Sur", "Agusan del Norte"],
  "Agus": ["Lanao del Sur", "Lanao del Norte"],
  "Buayan-Malungon": ["South Cotabato", "Sarangani"],
  "Davao": ["Davao del Sur"],
  "Mindanao": ["Cotabato", "Maguindanao", "Bukidnon"],
  "Tagoloan": ["Misamis Oriental", "Bukidnon"],
  "Angat Sub-basin": ["Bulacan"],
  "Ambuklao-Binga-San Roque Sub-basin": ["Benguet", "Pangasinan"],
  "Pantabangan Sub-basin": ["Nueva Ecija"],
  "Magat Sub-basin": ["Isabela", "Ifugao", "Nueva Vizcaya"],
};

/* ── Weather Advisory (national) ── */

export interface WeatherAdvisory {
  number: number;
  /** "Southwest Monsoon" */
  cause: string | null;
  issuedAt: string | null;
  url: string;
}

/** "5:00 PM 2025 July 22" -> ISO (Philippine Time), or null. */
function parseAdvisoryTime(value: string): string | null {
  const m = value.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*,?\s*(\d{4})\s+([A-Za-z]+)\s+(\d{1,2})/i);
  return m ? parseIssuedAt(`${m[1]}, ${m[4]} ${m[3]} ${m[2]}`) : parseIssuedAt(value);
}

export function parseWeatherAdvisory(html: string): { state: RainPageState; advisory: WeatherAdvisory | null } {
  const clean = stripNoise(html);
  const start = clean.indexOf('id="weather-advisory"');
  const part = start >= 0 ? clean.slice(start, start + 20_000) : clean;
  const lines = htmlLines(part);
  const text = lines.join("\n");
  const no = text.match(/WEATHER ADVISORY NO\.?\s*(\d+)/i);
  if (!no) {
    return /there is no Weather Advisory issued/i.test(text) ? { state: "none", advisory: null } : { state: "unknown", advisory: null };
  }
  const cause = text.match(/^FOR:\s*(.+)$/im)?.[1].trim() ?? null;
  const issued = text.match(/^ISSUED AT:\s*(.+)$/im)?.[1] ?? "";
  const pdf = part.match(/href="(https:\/\/pubfiles\.pagasa\.dost\.gov\.ph\/[^"]+\.pdf)"/i)?.[1];
  return {
    state: "active",
    advisory: { number: Number(no[1]), cause, issuedAt: parseAdvisoryTime(issued), url: pagasaLink(pdf) ?? PAGASA_WEATHER_ADVISORY_URL },
  };
}

/* ── Places ── */

type TownRow = [string, string, number, number];
let centroids: Map<string, { lat: number; lon: number }> | null = null;

/** Middle of a province: the average position of its towns. */
export function provinceCentroid(province: string): { lat: number; lon: number } | null {
  if (!centroids) {
    const sums = new Map<string, { lat: number; lon: number; n: number }>();
    for (const [, prov, lat, lon] of (towns as unknown as { towns: TownRow[] }).towns) {
      const s = sums.get(prov) ?? { lat: 0, lon: 0, n: 0 };
      s.lat += lat;
      s.lon += lon;
      s.n++;
      sums.set(prov, s);
    }
    centroids = new Map([...sums].map(([k, s]) => [k, { lat: s.lat / s.n, lon: s.lon / s.n }]));
  }
  const direct = centroids.get(province);
  if (direct) return direct;
  // "Maguindanao" (now del Norte and del Sur) and similar umbrella names.
  const parts = [...centroids].filter(([k]) => k.startsWith(`${province} `)).map(([, v]) => v);
  if (!parts.length) return null;
  return { lat: parts.reduce((a, p) => a + p.lat, 0) / parts.length, lon: parts.reduce((a, p) => a + p.lon, 0) / parts.length };
}

interface Where {
  provinces: string[];
  regions: string[];
  lat: number;
  lon: number;
}

function placeOf(provinces: Array<{ province: string; region: string }>): Where | null {
  const points = provinces.map((p) => provinceCentroid(p.province)).filter((p): p is { lat: number; lon: number } => !!p);
  if (!points.length) return null;
  return {
    provinces: provinces.map((p) => p.province),
    regions: [...new Set(provinces.map((p) => p.region))],
    lat: Math.round((points.reduce((a, p) => a + p.lat, 0) / points.length) * 1000) / 1000,
    lon: Math.round((points.reduce((a, p) => a + p.lon, 0) / points.length) * 1000) / 1000,
  };
}

/* ── Events ── */

const LEVEL_SEVERITY: Record<RainLevelName, IncidentSeverity> = { RED: "critical", ORANGE: "warning", YELLOW: "watch" };
const LEVEL_WORD: Record<RainLevelName, string> = { RED: "Red", ORANGE: "Orange", YELLOW: "Yellow" };

function officeLabel(office: string | null, key: string): string {
  return (office ?? key.toUpperCase()).replace(/_/g, " ");
}

function common(part: string, url: string, where: Where, extra: Incident["metadata"]): Incident["metadata"] {
  return {
    part,
    bulletin_url: url,
    warning_regions: where.regions.join("|"),
    warning_provinces: where.provinces.join("|"),
    // The marker is the middle of the listed provinces, not a place.
    location_approx: true,
    data_source: "PAGASA",
    ...extra,
  };
}

/** Events from one Regional Services Division's latest rainfall product. */
export function rainIncidents(pageKey: string, url: string, product: RainProduct, now = Date.now()): Incident[] {
  const age = now - Date.parse(product.issuedAt);
  if (!(age < RAIN_MAX_AGE_MS)) return [];
  const office = officeLabel(product.office, pageKey);
  const base = {
    source: "PAGASA" as const,
    event_type: "flood" as const,
    started_at: product.issuedAt,
    updated_at: product.issuedAt,
  };
  const shared = {
    product_no: product.number,
    office,
    weather_system: product.weatherSystem,
    advice: product.advice,
    body: product.body.length ? product.body.join("\n") : null,
    bulletin_stale: age > RAIN_STALE_MS,
  };
  const part = `rain:${pageKey}`;
  if (product.kind === "warning" && product.levels.length) {
    return product.levels.flatMap((lvl) => {
      const where = placeOf(findProvinces(provinceText(lvl.areas)));
      if (!where) return [];
      const ext = `rain-${pageKey}-${lvl.level.toLowerCase()}`;
      return [{
        ...base,
        id: `PAGASA:${ext}`,
        external_id: ext,
        title: `Heavy Rainfall Warning (${LEVEL_WORD[lvl.level]}) · ${lvl.areas}`,
        description: [lvl.hazard, product.advice].filter(Boolean).join(" "),
        latitude: where.lat,
        longitude: where.lon,
        severity: LEVEL_SEVERITY[lvl.level],
        region: where.regions[0] ?? "",
        metadata: common(part, url, where, {
          ...shared,
          product: "rainfall_warning",
          warning_level: LEVEL_WORD[lvl.level],
          level_areas: lvl.areas,
          hazard: lvl.hazard,
        }),
      }];
    });
  }
  // Rainfall Advisory (or a warning without levels): the areas in its text.
  const areaText = product.body.join(" ");
  const matches = findProvinces(provinceText(areaText));
  const where = placeOf(matches);
  if (!where) return [];
  const names = where.provinces;
  const ext = `rain-${pageKey}-advisory`;
  return [{
    ...base,
    id: `PAGASA:${ext}`,
    external_id: ext,
    title: `${product.kind === "warning" ? "Heavy Rainfall Warning" : "Rainfall Advisory"} · ${names.length > 3 ? `${names.slice(0, 3).join(", ")} and ${names.length - 3} more` : names.join(", ")}`,
    description: product.body.join(" "),
    latitude: where.lat,
    longitude: where.lon,
    severity: "advisory",
    region: where.regions[0] ?? "",
    metadata: common(part, url, where, { ...shared, product: product.kind === "warning" ? "rainfall_warning" : "rainfall_advisory" }),
  }];
}

/** Events for river basins and dam sub-basins whose status is not "Non-Flood Watch". */
export function basinIncidents(
  rows: BasinStatus[],
  pages: Map<string, BasinPage>,
  checkedAt: string,
  previous: Incident[] = [],
): Incident[] {
  return rows.flatMap((row) => {
    if (isNormalBasinStatus(row.status)) return [];
    const provinces = BASIN_PROVINCES[row.name];
    const where = provinces ? placeOf(provinces.flatMap((p) => findProvinces(p).slice(0, 1))) : null;
    if (!where) return [];
    const slug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const ext = `basin-${slug}`;
    const page = pages.get(row.name);
    const label = /sub-basin/i.test(row.name) ? row.name : `${row.name} River Basin`;
    // Without an issue time: the first time this status was seen.
    const prev = previous.find((i) => i.external_id === ext && i.metadata.basin_status === row.status);
    const time = page?.issuedAt ?? (typeof prev?.started_at === "string" ? prev.started_at : checkedAt);
    return [{
      id: `PAGASA:${ext}`,
      source: "PAGASA" as const,
      external_id: ext,
      event_type: "flood" as const,
      title: `${row.status} · ${label}`,
      description: [page?.forecastWater, page?.forecastRain].filter(Boolean).join(" "),
      latitude: where.lat,
      longitude: where.lon,
      severity: /warning/i.test(row.status) ? ("warning" as const) : ("watch" as const),
      region: where.regions[0] ?? "",
      started_at: time,
      updated_at: time,
      metadata: common("basins", row.url ?? PAGASA_FLOOD_URL, where, {
        product: "basin",
        basin_name: label,
        basin_status: row.status,
        // No issue time on the status table: the time is when DisasterPH first saw it.
        time_kind: page?.issuedAt ? "issued" : "seen",
        observed_rain: page?.observedRain ?? null,
        forecast_rain: page?.forecastRain ?? null,
        forecast_water: page?.forecastWater ?? null,
        basin_areas_source: "disasterph",
      }),
    }];
  });
}

/* ── Fetching ── */

async function getHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    headers: { Accept: "text/html", "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`${new URL(url).pathname} returned ${res.status}`);
  return res.text();
}

export interface RainFetchResult {
  events: Incident[];
  note: string;
  /** Parts that could not be read: their last known events are kept. */
  failedParts: string[];
  weatherAdvisory: WeatherAdvisory | null;
  weatherAdvisoryState: RainPageState;
}

export async function fetchPagasaRainFlood(previous: Incident[] = [], now = Date.now()): Promise<RainFetchResult> {
  const [regional, flood, advisory] = await Promise.all([
    Promise.allSettled(PRSD_PAGES.map((p) => getHtml(p.url))),
    getHtml(PAGASA_FLOOD_URL).then((h) => ({ ok: true as const, h }), (e: unknown) => ({ ok: false as const, e })),
    getHtml(PAGASA_WEATHER_ADVISORY_URL).then((h) => ({ ok: true as const, h }), (e: unknown) => ({ ok: false as const, e })),
  ]);
  if (regional.every((r) => r.status === "rejected") && !flood.ok && !advisory.ok) {
    throw new Error("PAGASA rainfall and flood pages could not be reached");
  }

  const events: Incident[] = [];
  const failedParts: string[] = [];
  const notes: string[] = [];

  regional.forEach((r, i) => {
    const page = PRSD_PAGES[i];
    const part = `rain:${page.key}`;
    if (r.status === "rejected") {
      failedParts.push(part);
      return;
    }
    const { state, product } = parseRegionalRain(r.value);
    if (state === "unknown") {
      failedParts.push(part);
      return;
    }
    if (product) {
      const made = rainIncidents(page.key, page.url, product, now);
      events.push(...made);
      notes.push(`${officeLabel(product.office, page.key)}: ${product.kind === "warning" ? "Heavy Rainfall Warning" : "Rainfall Advisory"} No. ${product.number ?? "?"}`);
    }
  });

  if (flood.ok) {
    try {
      const rows = parseBasins(flood.h);
      const active = rows.filter((r) => !isNormalBasinStatus(r.status));
      const pages = new Map<string, BasinPage>();
      // Basin pages (not the PDF bulletins) carry an issue time and forecasts.
      await Promise.allSettled(
        active
          .filter((r) => r.url && !/\.pdf$/i.test(r.url))
          .slice(0, 8)
          .map(async (r) => pages.set(r.name, parseBasinPage(await getHtml(r.url!)))),
      );
      events.push(...basinIncidents(rows, pages, new Date(now).toISOString(), previous));
      if (active.length) notes.push(`${active.length} river basin${active.length === 1 ? "" : "s"} not on Non-Flood Watch`);
    } catch {
      failedParts.push("basins");
    }
  } else {
    failedParts.push("basins");
  }

  let weatherAdvisory: WeatherAdvisory | null = null;
  let weatherAdvisoryState: RainPageState = "unknown";
  if (advisory.ok) {
    const parsed = parseWeatherAdvisory(advisory.h);
    weatherAdvisory = parsed.advisory;
    weatherAdvisoryState = parsed.state;
  }
  if (weatherAdvisory) notes.push(`Weather Advisory No. ${weatherAdvisory.number}${weatherAdvisory.cause ? ` (${weatherAdvisory.cause})` : ""}`);
  if (failedParts.length) notes.push(`Could not read: ${failedParts.join(", ")}`);
  return {
    events,
    note: notes.length ? notes.join(". ") + "." : "No PAGASA heavy rainfall warning, rainfall advisory, river basin flood watch or weather advisory.",
    failedParts,
    weatherAdvisory,
    weatherAdvisoryState,
  };
}
