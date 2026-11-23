import type { Incident, IncidentSeverity } from "@/types/incident";
import { regionMetadata } from "./regions";
import { fetchPhivolcsText } from "./https-text";

/**
 * Earthquakes from PHIVOLCS's own "Latest Earthquake Information" page
 * (https://earthquake.phivolcs.dost.gov.ph/). PHIVOLCS publishes no API; the
 * page is an HTML table of the current month's events, newest first, each
 * linking to its official bulletin:
 *
 *   Date - Time (Philippine Time) | Latitude (ºN) | Longitude (ºE) |
 *   Depth (km) | Mag | Location
 *
 * The parser fails loudly (throws) when the table cannot be recognised, so a
 * layout change shows up as a source failure and the scheduler falls back to
 * the USGS catalogue, clearly labelled as USGS, instead of showing nothing.
 */

export const PHIVOLCS_EQ_URL = "https://earthquake.phivolcs.dost.gov.ph/";
const PHIVOLCS_HOST = "earthquake.phivolcs.dost.gov.ph";

/** Shown on the map and feed: M3.0+ (roughly where quakes start to be
 *  commonly felt) from the last 7 days. */
export const EQ_MIN_MAGNITUDE = 3.0;
export const EQ_WINDOW_DAYS = 7;

export interface PhivolcsRow {
  /** Stable id: the event's UTC time (from the bulletin file name or the
   *  displayed time). It does not change when PHIVOLCS revises a bulletin. */
  id: string;
  /** Event time, ISO (UTC). */
  time: string;
  latitude: number;
  longitude: number;
  depthKm: number;
  magnitude: number;
  /** PHIVOLCS's location text, verbatim. */
  place: string;
  /** Official bulletin page, when linked. */
  bulletinUrl: string | null;
  /** Bulletin number (1, 2, 3, …); higher means revised. */
  bulletinNo: number | null;
}

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

function cellText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#176;|&deg;/gi, "°")
    .replace(/\s+/g, " ")
    .trim();
}

/** "23 November 2026 - 08:23 AM" (Philippine Time, UTC+8) -> epoch ms. */
export function parsePhtDateTime(value: string): number | null {
  const m = value.match(/^(\d{1,2}) ([A-Za-z]+) (\d{4}) - (\d{1,2}):(\d{2}) (AM|PM)$/i);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  const hour12 = Number(m[4]);
  if (month === undefined || hour12 < 1 || hour12 > 12) return null;
  const hour = (hour12 % 12) + (m[6].toUpperCase() === "PM" ? 12 : 0);
  return Date.UTC(Number(m[3]), month, Number(m[1]), hour, Number(m[5])) - 8 * 3_600_000;
}

/** Bulletin link -> absolute https URL on the PHIVOLCS host, else null. */
function bulletinUrl(href: string | undefined): string | null {
  if (!href) return null;
  try {
    const url = new URL(href.replace(/\\/g, "/"), PHIVOLCS_EQ_URL);
    return url.protocol === "https:" && url.hostname === PHIVOLCS_HOST ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Parse the PHIVOLCS table. Rows that fail validation are skipped; if the
 * table header is missing or no row parses, the layout has changed and this
 * throws.
 */
export function parsePhivolcsTable(html: string): PhivolcsRow[] {
  if (!/Date\s*-\s*Time/i.test(html) || !/Latitude/i.test(html)) {
    throw new Error("PHIVOLCS page layout not recognised (table header missing)");
  }
  const rows: PhivolcsRow[] = [];
  const seen = new Set<string>();
  for (const tr of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
    if (cells.length !== 6) continue;
    const href = cells[0].match(/href="([^"]+)"/i)?.[1];
    const [when, latS, lonS, depthS, magS, place] = cells.map(cellText);

    const shown = parsePhtDateTime(when);
    const latitude = Number(latS);
    const longitude = Number(lonS);
    const depthKm = Number(depthS);
    const magnitude = Number(magS);
    if (
      shown === null ||
      !latS || !Number.isFinite(latitude) || latitude < -5 || latitude > 30 ||
      !lonS || !Number.isFinite(longitude) || longitude < 110 || longitude > 140 ||
      !depthS || !Number.isFinite(depthKm) || depthKm < 0 || depthKm > 800 ||
      !magS || !Number.isFinite(magnitude) || magnitude < 0 || magnitude > 10 ||
      !place
    ) {
      continue;
    }

    // Bulletin file names start with the event's UTC time, e.g.
    // 2026_1123_002356_B1.html, 2026_1121_091033B3.html, 2026_1121_0650_B1.html.
    const file = href?.match(/(\d{4})_(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})?/);
    let time = shown;
    if (file) {
      const fromFile = Date.UTC(+file[1], +file[2] - 1, +file[3], +file[4], +file[5], +(file[6] ?? 0));
      // Trust the file name only when it agrees with the displayed time.
      if (Math.abs(fromFile - shown) < 90_000) time = fromFile;
    }
    let id = new Date(time).toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    if (seen.has(id)) id = `${id}-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
    seen.add(id);

    const bulletin = href?.match(/B(\d+)F?\.html$/i);
    rows.push({
      id,
      time: new Date(time).toISOString(),
      latitude,
      longitude,
      depthKm,
      magnitude,
      place,
      bulletinUrl: bulletinUrl(href),
      bulletinNo: bulletin ? Number(bulletin[1]) : null,
    });
  }
  if (rows.length === 0) {
    throw new Error("PHIVOLCS page layout not recognised (no earthquake rows)");
  }
  return rows;
}

/** Rows within the display window -> incidents. */
export function phivolcsRowsToIncidents(rows: PhivolcsRow[], now = Date.now()): Incident[] {
  const since = now - EQ_WINDOW_DAYS * 86_400_000;
  return rows
    .filter((r) => {
      const t = Date.parse(r.time);
      return r.magnitude >= EQ_MIN_MAGNITUDE && t >= since && t <= now + 600_000;
    })
    .map((r) => {
      const where = regionMetadata(r.latitude, r.longitude);
      return {
        id: `PHIVOLCS:${r.id}`,
        source: "PHIVOLCS" as const,
        external_id: r.id,
        event_type: "earthquake" as const,
        title: `Magnitude ${r.magnitude.toFixed(1)} earthquake — ${r.place}`,
        description: `PHIVOLCS recorded a magnitude ${r.magnitude.toFixed(1)} earthquake ${r.place} at a depth of ${r.depthKm.toFixed(0)} km.`,
        latitude: r.latitude,
        longitude: r.longitude,
        severity: magToSeverity(r.magnitude),
        region: where.region,
        started_at: r.time,
        updated_at: r.time,
        metadata: {
          magnitude: r.magnitude,
          depth_km: r.depthKm,
          data_source: "PHIVOLCS",
          // The agency's own epicenter description, kept verbatim.
          source_place: r.place,
          bulletin_url: r.bulletinUrl,
          bulletin_no: r.bulletinNo,
          ...where.metadata,
        },
      };
    });
}

export async function fetchPhivolcsEvents(): Promise<Incident[]> {
  // Verified HTTPS with the intermediate PHIVOLCS omits (see https-text.ts).
  const res = await fetchPhivolcsText(PHIVOLCS_EQ_URL);
  if (res.status !== 200) throw new Error(`PHIVOLCS earthquake page returned ${res.status}`);
  return phivolcsRowsToIncidents(parsePhivolcsTable(res.text));
}

export function magToSeverity(mag: number): IncidentSeverity {
  if (mag >= 6.5) return "critical";
  if (mag >= 5.0) return "warning";
  if (mag >= 4.0) return "watch";
  return "advisory";
}
