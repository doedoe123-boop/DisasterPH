import type { Incident, IncidentSeverity } from "@/types/incident";
import { findProvinces } from "@/lib/geo/ph-provinces";
import { regionMetadata } from "./regions";

/*
 * PAGASA tropical cyclone bulletins. PAGASA publishes no machine-readable
 * feed, so we read the official Severe Weather Bulletin page
 * (https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin):
 * one tab per active tropical cyclone with the bulletin number, issue time,
 * centre position (with coordinates), movement, strength, forecast
 * positions (text) and the Tropical Cyclone Wind Signals with their affected
 * areas.
 *
 * Only fields read with confidence become events. If the page says a bulletin
 * is active but a tab cannot be read (no name, issue time or centre
 * coordinates), no event is made for it and the source note sends people to
 * the official bulletin. Forecast positions are text only ("330 km East of
 * Itbayat, Batanes"); no track line is drawn from them.
 */

export const PAGASA_TC_BULLETIN_URL =
  "https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin";

/** What PAGASA's bulletin page says about tropical cyclones. */
export type TcBulletinState = "none" | "active" | "unknown";

export interface SourceFetchResult {
  events: Incident[];
  note: string;
  bulletin_state?: TcBulletinState;
  /** Fetched fine but could not be interpreted with confidence. */
  uncertain?: boolean;
}

function stripScripts(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&deg;|&#176;/gi, "°")
    .replace(/\s+/g, " ")
    .trim();
}

function pageText(html: string): string {
  return text(stripScripts(html));
}

/**
 * "none": PAGASA states there is no active tropical cyclone in the PAR.
 * "active": a numbered Tropical Cyclone Bulletin is published.
 * "unknown": neither statement found (page changed or partially loaded).
 */
export function readTcBulletinState(html: string): TcBulletinState {
  const t = pageText(html);
  if (/No Active Tropical Cyclone within the Philippine Area of Responsibility/i.test(t)) {
    return "none";
  }
  if (/Tropical Cyclone Bulletin\s*(No\.?|#|Number)\s*\d+/i.test(t)) {
    return "active";
  }
  return "unknown";
}

export interface WindSignal {
  level: number;
  luzon: string[];
  visayas: string[];
  mindanao: string[];
}

export interface TcBulletin {
  /** "Rosal" */
  name: string;
  /** "Super Typhoon", "Typhoon", "Severe Tropical Storm", "Tropical Storm", "Tropical Depression" */
  category: string;
  bulletinNo: number | null;
  /** ISO time the bulletin was issued. */
  issuedAt: string;
  /** "(Valid for broadcast until the next advisory to be issued at 5:00 PM today)" */
  nextBulletin: string | null;
  headline: string | null;
  centerText: string;
  latitude: number;
  longitude: number;
  movement: string | null;
  strength: string | null;
  maxWindKph: number | null;
  gustKph: number | null;
  forecast: string[];
  signals: WindSignal[];
  /** PAGASA's own guidance for the highest signal raised. */
  whatToDo: string[];
  precautions: string[];
  pdfUrl: string | null;
  trackImageUrl: string | null;
  signalsImageUrl: string | null;
}

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

/** "11:00 am, 22 October 2026" (Philippine Time) -> ISO, or null. */
export function parseIssuedAt(value: string): string | null {
  const m = value.match(/(\d{1,2}):(\d{2})\s*(am|pm)\s*,?\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
  if (!m) return null;
  const month = MONTHS[m[5].toLowerCase()];
  const h12 = Number(m[1]);
  if (month === undefined || h12 < 1 || h12 > 12) return null;
  const hour = (h12 % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0);
  return new Date(Date.UTC(+m[6], month, +m[4], hour, +m[2]) - 8 * 3_600_000).toISOString();
}

/** Only PAGASA-hosted https links. */
function pagasaUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, "https://www.pagasa.dost.gov.ph/");
    return url.protocol === "https:" && /(^|\.)pagasa\.dost\.gov\.ph$/.test(url.hostname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function panel(html: string, heading: RegExp): string | null {
  const m = html.match(new RegExp(`panel-heading">\\s*${heading.source}[\\s\\S]*?<div class="panel-body">([\\s\\S]*?)<\\/div>`, "i"));
  return m ? m[1] : null;
}

function items(html: string | undefined | null): string[] {
  return [...(html ?? "").matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((li) => text(li[1]))
    .filter((s) => s && s !== "-");
}

function islandGroup(cell: string, name: string): string[] {
  const m = cell.match(new RegExp(`<strong>\\s*${name}\\s*<\\/strong>\\s*<ul[^>]*>([\\s\\S]*?)<\\/ul>`, "i"));
  return items(m?.[1]);
}

function parseSignals(tab: string): { signals: WindSignal[]; whatToDo: string[]; precautions: string[] } {
  const signals: WindSignal[] = [];
  let whatToDo: string[] = [];
  let precautions: string[] = [];
  const parts = tab.split(/<th[^>]*class="signalno(\d)"[^>]*>/i);
  // parts: [before, level, body, level, body, ...]
  for (let i = 1; i + 1 < parts.length; i += 2) {
    const level = Number(parts[i]);
    const body = parts[i + 1].split(/<th[^>]*class="signalno/i)[0];
    const affected = body.match(/Affected Areas[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i)?.[1] ?? "";
    const signal = {
      level,
      luzon: islandGroup(affected, "Luzon"),
      visayas: islandGroup(affected, "Visayas"),
      mindanao: islandGroup(affected, "Mindanao"),
    };
    if (!(level >= 1 && level <= 5)) continue;
    if (signal.luzon.length + signal.visayas.length + signal.mindanao.length === 0) continue;
    signals.push(signal);
    if (level === Math.max(...signals.map((s) => s.level))) {
      whatToDo = items(body.match(/What To Do[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i)?.[1]);
      precautions = items(body.match(/Precautionary Measures[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i)?.[1]);
    }
  }
  signals.sort((a, b) => b.level - a.level);
  return { signals, whatToDo, precautions };
}

/**
 * Parse every tropical cyclone tab on the bulletin page. Tabs missing the
 * name, issue time or centre coordinates are skipped (reported in
 * `unreadable`).
 */
export function parseTcBulletins(rawHtml: string): { bulletins: TcBulletin[]; unreadable: number } {
  const html = stripScripts(rawHtml);
  const headers = new Map<string, string>();
  for (const m of html.matchAll(/href="#(tcwb-\d+)"[^>]*data-header="([^"]*)"/gi)) headers.set(m[1], text(m[2]));
  const tabs = [...html.matchAll(/<div[^>]*role="tabpanel"[^>]*id="(tcwb-\d+)"[^>]*>/gi)];

  const bulletins: TcBulletin[] = [];
  let unreadable = 0;
  tabs.forEach((tab, idx) => {
    const start = tab.index! + tab[0].length;
    const end = idx + 1 < tabs.length ? tabs[idx + 1].index! : html.length;
    const body = html.slice(start, end);

    const title = text(body.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? "");
    const named = title.match(/^(.*?)\s*"([^"]+)"/);
    const issuedAt = parseIssuedAt(text(body.match(/Issued at ([^<]+)</i)?.[1] ?? ""));
    const centerHtml = panel(body, /Location of (?:Eye\/)?[Cc]enter/);
    const centerText = centerHtml ? text(centerHtml) : "";
    const coords = centerText.match(/\(\s*(\d{1,2}(?:\.\d+)?)\s*°\s*N\s*,\s*(\d{2,3}(?:\.\d+)?)\s*°\s*E\s*\)/i);
    if (!named || !issuedAt || !coords) {
      unreadable++;
      return;
    }
    const latitude = Number(coords[1]);
    const longitude = Number(coords[2]);
    if (latitude < 0 || latitude > 30 || longitude < 105 || longitude > 145) {
      unreadable++;
      return;
    }
    const strength = panel(body, /Strength/);
    const strengthText = strength ? text(strength) : null;
    const wind = strengthText?.match(/sustained winds of (\d{2,3}) ?km\/h/i);
    const gust = strengthText?.match(/gustiness of up to (\d{2,3}) ?km\/h/i);
    const movement = panel(body, /Movement/);
    const headerNo = (headers.get(tab[1]) ?? "").match(/#\s*(\d+)/);
    const headline = body.match(/<div class="col-md-6">\s*<h5>([\s\S]*?)<\/h5>/i)?.[1];
    const next = body.match(/<h5[^>]*>\s*(\(Valid for broadcast[^<]*\))\s*<\/h5>/i)?.[1];
    const { signals, whatToDo, precautions } = parseSignals(body);

    bulletins.push({
      name: named[2].trim(),
      category: named[1].trim() || "Tropical Cyclone",
      bulletinNo: headerNo ? Number(headerNo[1]) : null,
      issuedAt,
      nextBulletin: next ? text(next) : null,
      headline: headline ? text(headline) : null,
      centerText,
      latitude,
      longitude,
      movement: movement ? text(movement) : null,
      strength: strengthText,
      maxWindKph: wind ? Number(wind[1]) : null,
      gustKph: gust ? Number(gust[1]) : null,
      forecast: items(panel(body, /Forecast Position/)),
      signals,
      whatToDo,
      precautions,
      pdfUrl: pagasaUrl(body.match(/href="([^"]+\.pdf)"/i)?.[1]),
      trackImageUrl: pagasaUrl(body.match(/<img[^>]+src="([^"]*track_[^"]+\.png)"/i)?.[1]),
      signalsImageUrl: pagasaUrl(body.match(/href\s*=\s*"([^"]*signals_[^"]+\.png)"/i)?.[1]),
    });
  });
  return { bulletins, unreadable };
}

/** Highest wind signal -> severity. Signal 3+ means storm-force or stronger winds. */
export function tcSeverity(highestSignal: number): IncidentSeverity {
  if (highestSignal >= 3) return "critical";
  if (highestSignal === 2) return "warning";
  if (highestSignal === 1) return "watch";
  return "advisory";
}

/** Bulletins older than this are flagged (PAGASA issues them every 3-6 hours). */
export const TC_BULLETIN_STALE_MS = 9 * 3_600_000;

export function tcIncidents(bulletins: TcBulletin[], now = Date.now()): Incident[] {
  return bulletins.map((b) => {
    const top = b.signals[0]?.level ?? 0;
    const areas = b.signals.flatMap((s) => [...s.luzon, ...s.visayas, ...s.mindanao]).join("; ");
    const matches = findProvinces(areas);
    const regions = [...new Set(matches.map((m) => m.region))];
    const where = regionMetadata(b.latitude, b.longitude);
    const slug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const label = `${b.category} "${b.name}"`;
    return {
      id: `PAGASA:tc-${slug}`,
      source: "PAGASA" as const,
      external_id: `tc-${slug}`,
      event_type: "typhoon" as const,
      title: top > 0 ? `${label} — Wind Signal No. ${top}` : `${label} — no wind signals raised`,
      description: [b.centerText, b.movement ?? "", b.strength ?? ""]
        .filter(Boolean)
        .map((s) => (/[.!?]$/.test(s) ? s : `${s}.`))
        .join(" "),
      latitude: b.latitude,
      longitude: b.longitude,
      severity: tcSeverity(top),
      region: where.region,
      started_at: b.issuedAt,
      updated_at: b.issuedAt,
      metadata: {
        tc_name: b.name,
        tc_category: b.category,
        bulletin_no: b.bulletinNo,
        // PAGASA's headline, as published (all caps).
        headline: b.headline,
        next_bulletin: b.nextBulletin,
        bulletin_stale: now - Date.parse(b.issuedAt) > TC_BULLETIN_STALE_MS,
        signal_number: top || null,
        wind_speed_kph: b.maxWindKph,
        gust_kph: b.gustKph,
        movement: b.movement,
        center_text: b.centerText,
        forecast: b.forecast.length ? b.forecast.join("\n") : null,
        // Plain JSON (strings and numbers only) for the detail page.
        signals_json: JSON.stringify(b.signals),
        signal_regions: regions.length ? regions.join("|") : null,
        signal_provinces: matches.length ? matches.map((m) => m.province).join("|") : null,
        what_to_do: b.whatToDo.length ? b.whatToDo.join("\n") : null,
        precautions: b.precautions.length ? b.precautions.join("\n") : null,
        bulletin_url: PAGASA_TC_BULLETIN_URL,
        pdf_url: b.pdfUrl,
        track_image_url: b.trackImageUrl,
        signals_image_url: b.signalsImageUrl,
        data_source: "PAGASA",
        ...where.metadata,
      },
    };
  });
}

export async function fetchPagasaEvents(): Promise<SourceFetchResult> {
  // Failures throw, so source health records them instead of "0 events".
  const res = await fetch(PAGASA_TC_BULLETIN_URL, {
    signal: AbortSignal.timeout(10_000),
    headers: {
      Accept: "text/html",
      "User-Agent": "DisasterPH/1.0 (disaster information; bulletin status check)",
    },
  });
  if (!res.ok) {
    throw new Error(`PAGASA bulletin page returned ${res.status}`);
  }

  const html = await res.text();
  const state = readTcBulletinState(html);
  if (state === "none") {
    return {
      events: [],
      note: "No active tropical cyclone in the Philippine Area of Responsibility (PAGASA bulletin page).",
      bulletin_state: state,
    };
  }
  if (state === "unknown") {
    return {
      events: [],
      note: "Could not read the tropical cyclone status from the PAGASA bulletin page.",
      bulletin_state: state,
      uncertain: true,
    };
  }

  const { bulletins, unreadable } = parseTcBulletins(html);
  const events = tcIncidents(bulletins);
  const names = bulletins.map((b) => `${b.category} "${b.name}" (bulletin #${b.bulletinNo ?? "?"})`);
  const note = [
    names.length ? `Active: ${names.join(", ")}.` : "",
    unreadable || !bulletins.length
      ? "Part of the PAGASA bulletin could not be read. See the official bulletin."
      : "",
  ].filter(Boolean).join(" ");
  return {
    events,
    note,
    bulletin_state: state,
    ...((unreadable > 0 || bulletins.length === 0) && { uncertain: true }),
  };
}
