import type { Incident, IncidentSeverity } from "@/types/incident";
import { findProvinces } from "@/lib/geo/ph-provinces";
import { fetchPhivolcs } from "./https-text";
import { provinceCentroid } from "./pagasa-rain";

/*
 * PHIVOLCS Tsunami Information (https://tsunami.phivolcs.dost.gov.ph/).
 *
 * The page lists every earthquake PHIVOLCS evaluated for a tsunami, newest
 * first, each with its bulletins ("Tsunami Information # 1", "# 2", ...).
 * Bulletins are HTML pages with a fixed layout (checked 2026-11-27 against
 * real bulletins: NO TSUNAMI THREAT, ADVISORY: MINOR SEA-LEVEL DISTURBANCE,
 * TSUNAMI WARNING), and follow-up bulletins are often PDFs only.
 *
 * Everything shown is PHIVOLCS's wording: the heading (threat level), the
 * evaluation, the recommended action, the provinces and the arrival window.
 * DisasterPH cannot read the PDF bulletins (Word exports with embedded
 * fonts): when a newer bulletin is a PDF, the earlier HTML bulletin is shown
 * as earlier, with the PDF linked and a plain "open it now".
 *
 * Ours: the severity label, the marker position (middle of the listed
 * provinces), matching a bulletin to an earthquake in the list, and how long
 * a bulletin stays up (24 hours after it was issued).
 */

export const PHIVOLCS_TSUNAMI_URL = "https://tsunami.phivolcs.dost.gov.ph/";
/** Earthquakes listed in the last 7 days (the earthquake window) have their bulletins read (each once). */
export const TSUNAMI_RECENT_MS = 7 * 86_400_000;
/** A tsunami warning or advisory is shown for this long after it was issued. */
export const TSUNAMI_SHOW_MS = 24 * 3_600_000;

/* ── Text helpers ── */

function stripNoise(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;|&emsp;|&ensp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&deg;|&#176;/gi, "°")
    .replace(/&amp;/gi, "&");
}

function htmlLines(html: string): string[] {
  return decode(
    stripNoise(html)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h\d|tr|td|th)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

/** "08 Jun 2026 - 07:47:59 AM" or "07:37 AM, 08 Jun 2026" (Philippine time) -> ISO, or null. */
export function parsePst(value: string): string | null {
  const a = value.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})\s*-?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)/i);
  const b = value.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M),?\s*(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/i);
  let d: number, mon: string, y: number, h: number, mi: number, s: number, ap: string;
  if (a) [d, mon, y, h, mi, s, ap] = [+a[1], a[2], +a[3], +a[4], +a[5], +(a[6] ?? 0), a[7]];
  else if (b) [h, mi, s, ap, d, mon, y] = [+b[1], +b[2], +(b[3] ?? 0), b[4], +b[5], b[6], +b[7]];
  else return null;
  const month = MONTHS[mon.toLowerCase()];
  if (month === undefined || h < 1 || h > 12) return null;
  const hour = (h % 12) + (ap.toUpperCase() === "PM" ? 12 : 0);
  return new Date(Date.UTC(y, month, d, hour, mi, s) - 8 * 3_600_000).toISOString();
}

function coord(value: string): number | null {
  const m = value.match(/(-?\d+(?:\.\d+)?)\s*°?\s*([NSEW])/i);
  if (!m) return null;
  const v = Number(m[1]);
  return /[SW]/i.test(m[2]) ? -v : v;
}

/** Only https links on PHIVOLCS hosts. */
function phivolcsLink(href: string): string | null {
  try {
    const url = new URL(href, PHIVOLCS_TSUNAMI_URL);
    return url.protocol === "https:" && /(^|\.)phivolcs\.dost\.gov\.ph$/.test(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

/* ── The list ── */

export interface BulletinLink {
  number: number;
  url: string;
  pdf: boolean;
}

export interface TsunamiListEntry {
  /** As listed (Philippine time) -> ISO */
  time: string;
  lat: number;
  lon: number;
  depthKm: number | null;
  magnitude: number | null;
  place: string;
  bulletins: BulletinLink[];
}

/** Rows of the tsunami information table. Throws if the table is missing. */
export function parseTsunamiList(html: string): TsunamiListEntry[] {
  const clean = stripNoise(html);
  if (!/PHIVOLCS TSUNAMI INFORMATION/i.test(clean) || !/Advisory/i.test(clean)) {
    throw new Error("PHIVOLCS tsunami page: table not found");
  }
  const out: TsunamiListEntry[] = [];
  for (const row of clean.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
    if (cells.length < 7) continue;
    const textOf = (c: string) => decode(c.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    const time = parsePst(textOf(cells[0]));
    const lat = coord(textOf(cells[1]));
    const lon = coord(textOf(cells[2]));
    if (!time || lat === null || lon === null) continue;
    const bulletins: BulletinLink[] = [];
    for (const a of cells[6].matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
      const url = phivolcsLink(a[1]);
      const number = Number(textOf(a[2]).match(/#\s*(\d+)/)?.[1]);
      if (url && Number.isFinite(number)) bulletins.push({ number, url, pdf: /\.pdf$/i.test(url) });
    }
    const depth = Number(textOf(cells[3]));
    const mag = Number(textOf(cells[4]));
    out.push({
      time,
      lat,
      lon,
      depthKm: Number.isFinite(depth) ? depth : null,
      magnitude: Number.isFinite(mag) ? mag : null,
      place: textOf(cells[5]),
      bulletins: bulletins.sort((x, y) => y.number - x.number),
    });
  }
  if (out.length === 0) throw new Error("PHIVOLCS tsunami page: no rows read");
  return out;
}

/* ── A bulletin ── */

export type TsunamiKind = "none" | "warning" | "advisory" | "other";

export interface TsunamiBulletin {
  number: number;
  /** As published: "TSUNAMI WARNING", "ADVISORY: MINOR SEA-LEVEL DISTURBANCE", "NO TSUNAMI THREAT" */
  heading: string;
  kind: TsunamiKind;
  quakeTime: string | null;
  place: string | null;
  magnitude: number | null;
  depthKm: number | null;
  /** PHIVOLCS's evaluation, one line per paragraph. */
  evaluation: string[];
  /** The arrival window as published ("07:37 AM, 08 Jun 2026"). */
  arrivalFrom: string | null;
  arrivalTo: string | null;
  /** The recommended action, without the province list. */
  action: string[];
  /** The provinces (and cities) named in the recommended action, as published. */
  areas: string[];
  issuedAt: string | null;
}

export function kindOf(heading: string): TsunamiKind {
  if (/NO\s+TSUNAMI\s+THREAT/i.test(heading)) return "none";
  if (/WARNING/i.test(heading)) return "warning";
  if (/ADVISORY/i.test(heading)) return "advisory";
  return "other";
}

/** Whether a line of the recommended action is a place name (not a sentence). */
function isPlaceLine(line: string): boolean {
  if (line.length > 48 || /[.:;!?]$/.test(line) || /\b(advised|should|people|owners|boats|evacuat|order)\b/i.test(line)) return false;
  return findProvinces(line).length > 0 || /^(city of|island|islands)\b/i.test(line) || /\bcity$/i.test(line);
}

export function parseTsunamiBulletin(html: string): TsunamiBulletin {
  const lines = htmlLines(html);
  const all = lines.join("\n");
  const at = lines.findIndex((l) => /^TSUNAMI INFORMATION NO\.?/i.test(l));
  if (at < 0) throw new Error("PHIVOLCS tsunami bulletin: heading not found");
  const sameLine = lines[at].match(/NO\.?\s*(\d+)/i);
  const number = Number(sameLine?.[1] ?? lines[at + 1]);
  const heading = lines[sameLine ? at + 1 : at + 2] ?? "";
  if (!Number.isFinite(number) || !heading) throw new Error("PHIVOLCS tsunami bulletin: number or level not found");

  const field = (label: RegExp) => {
    const i = lines.findIndex((l) => label.test(l));
    if (i < 0) return null;
    const rest = lines[i].replace(label, "").replace(/^\s*:\s*/, "").trim();
    if (rest) return rest;
    const next = lines[i + 1] === ":" ? lines[i + 2] : lines[i + 1]?.replace(/^:\s*/, "");
    return next ?? null;
  };
  const section = (from: RegExp, to: RegExp) => {
    const i = lines.findIndex((l) => from.test(l));
    if (i < 0) return [];
    const j = lines.findIndex((l, k) => k > i && to.test(l));
    return lines.slice(i + 1, j > i ? j : undefined);
  };

  const locationText = field(/^Location/i);
  const place = locationText?.split(/\s+-\s+/).slice(1).join(" - ").trim() || null;
  const magnitude = Number(field(/^Magnitude/i));
  const depth = Number(field(/^Depth/i));
  // Join wrapped lines of the arrival sentence before matching it.
  const arrival = all.replace(/\n/g, " ").match(/arrive between\s+(.+?)\s+to\s+(.+?)\s*\(PST\)/i);
  const evaluation = section(/^EVALUATION$/i, /^RECOMMENDED ACTION$/i)
    .join(" ")
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const actionLines = section(/^RECOMMENDED ACTION$/i, /^Issued on/i);
  const areas = actionLines.filter(isPlaceLine);
  const action = actionLines.filter((l) => !isPlaceLine(l));
  const issued = field(/^Issued on/i);
  return {
    number,
    heading,
    kind: kindOf(heading),
    quakeTime: parsePst(field(/^Date and Time/i) ?? ""),
    place,
    magnitude: Number.isFinite(magnitude) ? magnitude : null,
    depthKm: Number.isFinite(depth) ? depth : null,
    evaluation,
    arrivalFrom: arrival?.[1].trim() ?? null,
    arrivalTo: arrival?.[2].trim() ?? null,
    action,
    areas,
    issuedAt: issued ? parsePst(issued) : null,
  };
}

/* ── What DisasterPH keeps per earthquake ── */

export interface TsunamiInfo {
  quakeTime: string;
  lat: number;
  lon: number;
  magnitude: number | null;
  place: string;
  /** The latest HTML bulletin DisasterPH could read. */
  bulletin: TsunamiBulletin | null;
  bulletinUrl: string | null;
  /** A newer bulletin that is a PDF only (not readable here). */
  newerPdf: { number: number; url: string } | null;
}

const SEVERITY: Record<Exclude<TsunamiKind, "none">, IncidentSeverity> = { warning: "critical", advisory: "warning", other: "watch" };

function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|[\s:(/-])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase());
}

/**
 * Events for tsunami warnings and advisories that name Philippine provinces,
 * for 24 hours after the bulletin was issued. "No tsunami threat" bulletins
 * make no event: they are shown on the earthquake's card instead.
 */
export function tsunamiIncidents(infos: TsunamiInfo[], now = Date.now()): Incident[] {
  return infos.flatMap((info) => {
    const b = info.bulletin;
    if (!b || b.kind === "none" || b.areas.length === 0) return [];
    const issued = b.issuedAt ?? info.quakeTime;
    if (!(now - Date.parse(issued) < TSUNAMI_SHOW_MS)) return [];
    const matches = b.areas.flatMap((a) => findProvinces(a).slice(0, 1));
    const points = matches.map((m) => provinceCentroid(m.province)).filter((p): p is { lat: number; lon: number } => !!p);
    if (!points.length) return [];
    const regions = [...new Set(matches.map((m) => m.region))];
    const stamp = info.quakeTime.replace(/[-:]/g, "").slice(0, 13);
    const ext = `tsunami-${stamp}`;
    const names = b.areas;
    const areaText = names.length > 3 ? `${names.slice(0, 3).join(", ")} and ${names.length - 3} more` : names.join(", ");
    return [{
      id: `PHIVOLCS:${ext}`,
      source: "PHIVOLCS" as const,
      external_id: ext,
      event_type: "tsunami" as const,
      title: `${titleCase(b.heading)} · ${areaText}`,
      description: [...b.evaluation, ...b.action].join(" "),
      latitude: Math.round((points.reduce((a, p) => a + p.lat, 0) / points.length) * 1000) / 1000,
      longitude: Math.round((points.reduce((a, p) => a + p.lon, 0) / points.length) * 1000) / 1000,
      severity: SEVERITY[b.kind],
      region: regions[0] ?? "",
      started_at: info.quakeTime,
      updated_at: issued,
      metadata: {
        tsunami_heading: b.heading,
        tsunami_kind: b.kind,
        tsunami_no: b.number,
        evaluation: b.evaluation.join("\n"),
        action: b.action.join("\n"),
        tsunami_areas: names.join("\n"),
        arrival_from: b.arrivalFrom,
        arrival_to: b.arrivalTo,
        quake_place: b.place ?? info.place,
        magnitude: b.magnitude ?? info.magnitude,
        depth_km: b.depthKm,
        bulletin_url: info.bulletinUrl,
        newer_pdf_no: info.newerPdf?.number ?? null,
        newer_pdf_url: info.newerPdf?.url ?? null,
        warning_regions: regions.join("|"),
        warning_provinces: matches.map((m) => m.province).join("|"),
        location_approx: true,
        data_source: "PHIVOLCS",
      },
    }];
  });
}

/* ── Matching a bulletin to an earthquake in the list ── */

/** The tsunami information for a listed earthquake: within 10 minutes and 150 km. */
export function tsunamiForQuake(quake: Incident, infos: TsunamiInfo[]): TsunamiInfo | null {
  if (quake.event_type !== "earthquake") return null;
  const t = Date.parse(quake.started_at || quake.updated_at);
  let best: { info: TsunamiInfo; score: number } | null = null;
  for (const info of infos) {
    const dt = Math.abs(Date.parse(info.quakeTime) - t);
    const dKm = Math.hypot(info.lat - quake.latitude, (info.lon - quake.longitude) * Math.cos((quake.latitude * Math.PI) / 180)) * 111;
    if (dt > 10 * 60_000 || dKm > 150) continue;
    const score = dt / 60_000 + dKm / 15;
    if (!best || score < best.score) best = { info, score };
  }
  return best?.info ?? null;
}

/** Tsunami information as earthquake metadata (for the card). */
export function tsunamiMetadata(info: TsunamiInfo): Incident["metadata"] {
  const b = info.bulletin;
  return {
    tsunami_heading: b?.heading ?? null,
    tsunami_kind: b?.kind ?? null,
    tsunami_no: b?.number ?? null,
    tsunami_issued_at: b?.issuedAt ?? null,
    tsunami_evaluation: b?.evaluation.join("\n") ?? null,
    tsunami_url: info.bulletinUrl,
    tsunami_newer_pdf_no: info.newerPdf?.number ?? null,
    tsunami_newer_pdf_url: info.newerPdf?.url ?? null,
  };
}

/* ── Fetching ── */

async function getHtml(url: string): Promise<string> {
  const res = await fetchPhivolcs(url, { timeoutMs: 10_000, maxBytes: 2 * 1024 * 1024 });
  if (res.status !== 200) throw new Error(`${new URL(url).pathname} returned ${res.status}`);
  return res.body.toString("utf8");
}

// Bulletins never change once published: read each one once.
const bulletinCache = new Map<string, TsunamiBulletin>();

export interface TsunamiFetchResult {
  infos: TsunamiInfo[];
  events: Incident[];
  note: string;
  /** A recent bulletin could not be read. */
  uncertain: boolean;
}

export async function fetchPhivolcsTsunami(now = Date.now()): Promise<TsunamiFetchResult> {
  const list = parseTsunamiList(await getHtml(PHIVOLCS_TSUNAMI_URL));
  const recent = list.filter((e) => now - Date.parse(e.time) < TSUNAMI_RECENT_MS && Date.parse(e.time) <= now + 600_000);
  let uncertain = false;
  const infos: TsunamiInfo[] = [];
  for (const entry of recent) {
    const html = entry.bulletins.filter((b) => !b.pdf);
    const latest = entry.bulletins[0];
    const readable = html[0];
    let bulletin: TsunamiBulletin | null = null;
    if (readable) {
      bulletin = bulletinCache.get(readable.url) ?? null;
      if (!bulletin) {
        try {
          bulletin = parseTsunamiBulletin(await getHtml(readable.url));
          bulletinCache.set(readable.url, bulletin);
        } catch {
          uncertain = true;
        }
      }
    }
    infos.push({
      quakeTime: entry.time,
      lat: entry.lat,
      lon: entry.lon,
      magnitude: entry.magnitude,
      place: entry.place,
      bulletin,
      bulletinUrl: readable?.url ?? null,
      newerPdf: latest && latest.pdf && (!readable || latest.number > readable.number) ? { number: latest.number, url: latest.url } : null,
    });
  }
  const events = tsunamiIncidents(infos, now);
  // In effect = has an event now (warnings and advisories drop off after 24 h).
  const active = infos.filter((i) => events.some((e) => e.started_at === i.quakeTime));
  const note = active.length
    ? active.map((i) => `${i.place}: ${i.bulletin!.heading} (Tsunami Information No. ${i.bulletin!.number}${i.newerPdf ? `; No. ${i.newerPdf.number} is a PDF` : ""})`).join(". ") + "."
    : recent.length
      ? `${recent.length} earthquake${recent.length === 1 ? "" : "s"} evaluated in the last 7 days; no tsunami warning or advisory in effect.`
      : "No earthquake evaluated for a tsunami in the last 7 days.";
  return { infos, events, note, uncertain };
}
