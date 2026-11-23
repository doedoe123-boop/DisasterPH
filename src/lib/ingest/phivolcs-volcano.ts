import type { Incident, IncidentSeverity } from "@/types/incident";
import { regionMetadata } from "./regions";
import { fetchPhivolcsText } from "./https-text";

/**
 * Volcano alert levels from PHIVOLCS (no API exists):
 *
 * 1. The volcano bulletin list page carries the current "Alert Level Status"
 *    for every monitored volcano (e.g. "Taal - 1  Kanlaon - 2  Mayon - 3")
 *    and links to each volcano's latest daily bulletin in English and
 *    Filipino.
 * 2. Each English bulletin gives the date, alert level and its meaning,
 *    monitoring parameters, what should not be allowed (e.g. entry into the
 *    Permanent Danger Zone) and possible hazards.
 *
 * Volcanoes at Alert Level 1 or higher become map events; Level 0 volcanoes
 * are listed in the source note only. Layout changes throw, so they show as
 * a source failure instead of a silent "no volcano activity".
 */

export const VOLCANO_LIST_URL = "https://wovodat.phivolcs.dost.gov.ph/bulletin/list-of-bulletin";
const VOLCANO_BASE = "https://wovodat.phivolcs.dost.gov.ph";

export interface MonitoredVolcano {
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * Volcanoes with a PHIVOLCS observatory code. Summit positions from the
 * Smithsonian Global Volcanism Program (Volcanoes of the World, retrieved
 * 2026-11-23); Hibok-Hibok is listed there as "Camiguin".
 */
export const MONITORED_VOLCANOES: Record<string, MonitoredVolcano> = {
  tvo: { name: "Taal", latitude: 14.0106, longitude: 120.9975 },
  kvo: { name: "Kanlaon", latitude: 10.4096, longitude: 123.13 },
  mvo: { name: "Mayon", latitude: 13.257, longitude: 123.685 },
  bvo: { name: "Bulusan", latitude: 12.769, longitude: 124.056 },
  pvo: { name: "Pinatubo", latitude: 15.13, longitude: 120.35 },
  hvo: { name: "Hibok-Hibok", latitude: 9.203, longitude: 124.673 },
};

export interface AlertLevelStatus {
  code: string;
  name: string;
  level: number;
}

export interface VolcanoBulletin {
  /** "2026-11-23" (the bulletin's date, Philippine Time). */
  date: string;
  level: number;
  /** PHIVOLCS's wording for the level, e.g. "Intensified Unrest / Magmatic Unrest". */
  status: string;
  parameters: Record<string, string>;
  prohibited: string[];
  hazards: string[];
  location: string | null;
  /** Permanent Danger Zone radius when given as a distance. */
  pdzRadiusKm: number | null;
}

const MONTHS: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
};

function text(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, " ");
}

/** "Alert Level Status" line on the list page. Throws if it is missing. */
export function parseAlertLevelStatus(listHtml: string): AlertLevelStatus[] {
  const out: AlertLevelStatus[] = [];
  const html = stripComments(listHtml);
  for (const m of html.matchAll(/class="\s*([a-z]{3})-scroll-level[^"]*"[^>]*>([^<]+)</gi)) {
    const code = m[1].toLowerCase();
    const parts = text(m[2]).match(/^(.+?)\s*-\s*([0-5])$/);
    if (!parts || out.some((s) => s.code === code)) continue;
    out.push({ code, name: parts[1], level: Number(parts[2]) });
  }
  if (out.length === 0) {
    throw new Error("PHIVOLCS volcano page layout not recognised (no alert level status)");
  }
  return out;
}

/** Latest English bulletin link per observatory code (first one listed). */
export function parseBulletinLinks(listHtml: string): Record<string, string> {
  const links: Record<string, string> = {};
  const html = stripComments(listHtml);
  for (const m of html.matchAll(/href="(\/bulletin\/activity-([a-z]{3})\?bid=(\d+)&(?:amp;)?lang=en)"/gi)) {
    const code = m[2].toLowerCase();
    if (!links[code]) links[code] = `${VOLCANO_BASE}/bulletin/activity-${code}?bid=${m[3]}&lang=en`;
  }
  return links;
}

/** One English daily bulletin. Throws if the date or level is missing. */
export function parseVolcanoBulletin(rawHtml: string): VolcanoBulletin {
  const html = stripComments(rawHtml);
  const dateText = html.match(/class="txt-date"[^>]*>\s*Date:\s*([^<]+)</i)?.[1]?.trim();
  const dm = dateText?.match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/);
  const month = dm ? MONTHS[dm[2].toLowerCase()] : undefined;
  const levelText = html.match(/class="circle"[^>]*>\s*([0-5])\s*</i)?.[1];
  if (!dm || !month || levelText === undefined) {
    throw new Error("PHIVOLCS volcano bulletin layout not recognised (date or alert level missing)");
  }
  const status = text(html.match(/class="txt-status"[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "").replace(/^\(|\)$/g, "");

  const parameters: Record<string, string> = {};
  const paramBlock = html.match(/PARAMETERS<\/p>([\s\S]*?)<\/table>/i)?.[1] ?? "";
  for (const row of paramBlock.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
    if (cells.length < 2) continue;
    const label = text(cells[0].match(/<b>([\s\S]*?)<\/b>/i)?.[1] ?? cells[0]);
    const value = text(cells[1]);
    if (label && value) parameters[label] = value;
  }

  const listItems = (block: string | undefined) =>
    [...(block ?? "").matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((li) => text(li[1])).filter(Boolean);
  const prohibited = listItems(html.match(/<ul[^>]*class="ul-bawal"[^>]*>([\s\S]*?)<\/ul>/i)?.[1]);
  const hazards = listItems(html.match(/Possible hazards[^<]*<\/p>\s*<ul[^>]*>([\s\S]*?)<\/ul>/i)?.[1]);
  const location = text(html.match(/Location of [^<:]*:\s*<\/b>([^<]*)</i)?.[1] ?? "") || null;

  const pdz = prohibited.find((p) => /Permanent Danger Zone/i.test(p));
  const km = pdz?.match(/(\d+(?:\.\d+)?)\s*-?\s*(?:km|kilometer)/i);

  return {
    date: `${dm[3]}-${month}-${dm[1].padStart(2, "0")}`,
    level: Number(levelText),
    status,
    parameters,
    prohibited,
    hazards,
    location,
    pdzRadiusKm: km ? Number(km[1]) : null,
  };
}

/** PHIVOLCS volcano alert level -> DisasterPH severity. */
export function volcanoSeverity(level: number): IncidentSeverity {
  if (level >= 4) return "critical"; // hazardous eruption imminent / in progress
  if (level === 3) return "warning"; // intensified / magmatic unrest
  if (level === 2) return "watch"; // increasing unrest
  return "advisory"; // low-level unrest
}

/** A bulletin older than this is flagged as stale (bulletins are daily). */
export const BULLETIN_STALE_MS = 2 * 86_400_000;

export function volcanoIncidents(
  statuses: AlertLevelStatus[],
  bulletins: Record<string, { url: string; bulletin: VolcanoBulletin } | undefined>,
  fetchedAt: string,
  now = Date.now(),
): Incident[] {
  const out: Incident[] = [];
  for (const s of statuses) {
    const volcano = MONITORED_VOLCANOES[s.code];
    if (!volcano) continue;
    const b = bulletins[s.code];
    // Conservative: if the summary line and the bulletin disagree, use the higher level.
    const level = Math.max(s.level, b?.bulletin.level ?? 0);
    if (level < 1) continue;

    const issued = b ? `${b.bulletin.date}T00:00:00+08:00` : fetchedAt;
    const issuedIso = new Date(issued).toISOString();
    const stale = !b || now - new Date(issued).getTime() > BULLETIN_STALE_MS;
    // Details are only used when the bulletin matches the current level; an
    // older bulletin (e.g. before the level was raised) could understate the
    // danger zone and hazards.
    const matches = !!b && b.bulletin.level === level;
    const status = matches ? b.bulletin.status : "";
    const where = regionMetadata(volcano.latitude, volcano.longitude);
    const pdz = matches ? b.bulletin.prohibited.find((p) => /Permanent Danger Zone/i.test(p)) : undefined;
    const hazards = matches ? b.bulletin.hazards : [];

    const description = [
      `PHIVOLCS: ${volcano.name} Volcano is at Alert Level ${level}${status ? ` (${status})` : ""}.`,
      pdz ? `Should not be allowed: ${pdz}.` : "",
      hazards.length ? `Possible hazards: ${hazards.join("; ")}.` : "",
      b && !matches
        ? `The latest daily bulletin (${b.bulletin.date}) was issued at Alert Level ${b.bulletin.level}. Check PHIVOLCS for current advisories.`
        : "",
    ].filter(Boolean).join(" ");

    out.push({
      id: `PHIVOLCS:volcano-${s.code}`,
      source: "PHIVOLCS",
      external_id: `volcano-${s.code}`,
      event_type: "volcano",
      title: `${volcano.name} Volcano — Alert Level ${level}${status ? ` (${status})` : ""}`,
      description,
      latitude: volcano.latitude,
      longitude: volcano.longitude,
      severity: volcanoSeverity(level),
      // A province from the bulletin reads better than an inferred region.
      region: where.region,
      started_at: issuedIso,
      updated_at: issuedIso,
      metadata: {
        alert_level: level,
        alert_status: status || null,
        level_mismatch: b ? b.bulletin.level !== s.level : false,
        bulletin_date: b?.bulletin.date ?? null,
        bulletin_url: b?.url ?? null,
        bulletin_stale: stale,
        province: b?.bulletin.location ?? null,
        pdz_radius_km: matches ? b.bulletin.pdzRadiusKm : null,
        prohibited: matches ? b.bulletin.prohibited.join("\n") : null,
        hazards: hazards.length ? hazards.join("\n") : null,
        seismicity: matches ? (b.bulletin.parameters["Seismicity"] ?? null) : null,
        so2_flux: matches ? (b.bulletin.parameters["Sulfur Dioxide Flux"] ?? null) : null,
        plume: matches ? (b.bulletin.parameters["Plume"] ?? null) : null,
        ground_deformation: matches ? (b.bulletin.parameters["Ground Deformation"] ?? null) : null,
        data_source: "PHIVOLCS",
        ...where.metadata,
      },
    });
  }
  return out;
}

/** Parsed bulletins by URL; each daily bulletin is fetched once. */
const bulletinCache = new Map<string, VolcanoBulletin>();

export interface VolcanoFetchResult {
  events: Incident[];
  note: string;
}

export async function fetchPhivolcsVolcanoes(): Promise<VolcanoFetchResult> {
  const list = await fetchPhivolcsText(VOLCANO_LIST_URL);
  if (list.status !== 200) throw new Error(`PHIVOLCS volcano page returned ${list.status}`);
  const statuses = parseAlertLevelStatus(list.text);
  const links = parseBulletinLinks(list.text);

  const bulletins: Record<string, { url: string; bulletin: VolcanoBulletin } | undefined> = {};
  const problems: string[] = [];
  for (const s of statuses) {
    const url = links[s.code];
    if (!url || !MONITORED_VOLCANOES[s.code] || s.level < 1) continue;
    let bulletin = bulletinCache.get(url);
    if (!bulletin) {
      try {
        const res = await fetchPhivolcsText(url);
        if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
        bulletin = parseVolcanoBulletin(res.text);
        bulletinCache.set(url, bulletin);
        if (bulletinCache.size > 50) bulletinCache.delete(bulletinCache.keys().next().value!);
      } catch (error) {
        problems.push(`${s.name}: bulletin unavailable (${error instanceof Error ? error.message : "error"})`);
        continue;
      }
    }
    bulletins[s.code] = { url, bulletin };
  }

  const fetchedAt = new Date().toISOString();
  const levels = statuses.map((s) => `${s.name} ${s.level}`).join(", ");
  const unknown = statuses.filter((s) => !MONITORED_VOLCANOES[s.code]).map((s) => s.name);
  const note = [
    `Alert levels: ${levels} (PHIVOLCS).`,
    unknown.length ? `Not mapped: ${unknown.join(", ")}.` : "",
    ...problems,
  ].filter(Boolean).join(" ");
  return { events: volcanoIncidents(statuses, bulletins, fetchedAt), note };
}
