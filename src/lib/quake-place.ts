/**
 * Place-first earthquake titles: "M5.1 · Valderrama, Antique (12 km SE)".
 *
 * Built only from the agency's own location text. PHIVOLCS writes
 * "012 km S 49° E of Valderrama (Antique)"; USGS writes
 * "45 km SSW of Sarangani, Philippines". When the text doesn't match these
 * patterns, the title uses the raw text unchanged, so no place is ever made
 * up. The exact agency text is kept in metadata.source_place and shown on the
 * event page.
 */

const POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

/** "S 49° E" -> "SE" (quadrant bearing to the nearest of 8 compass points). */
export function quadrantToCompass(ns: string, deg: number, ew: string): string | null {
  if (!Number.isFinite(deg) || deg < 0 || deg > 90) return null;
  const n = ns.toUpperCase();
  const e = ew.toUpperCase();
  let azimuth: number;
  if (n === "N" && e === "E") azimuth = deg;
  else if (n === "N" && e === "W") azimuth = 360 - deg;
  else if (n === "S" && e === "E") azimuth = 180 - deg;
  else if (n === "S" && e === "W") azimuth = 180 + deg;
  else return null;
  return POINTS[Math.round(azimuth / 45) % 8];
}

export interface ParsedQuakePlace {
  /** "Valderrama, Antique" */
  place: string;
  /** "12 km SE", or null when the epicentre is at the place itself. */
  offset: string | null;
}

const WORD_BEARING: Record<string, string> = { north: "N", south: "S", east: "E", west: "W" };

/**
 * PHIVOLCS location text. Seen forms (Nov 2026 list, 1,456 rows):
 *   "012 km S 49° E of Valderrama (Antique)"
 *   "037 km S 05° W of Balut Island (Municipality Of Sarangani) (Davao Occidental)"
 *   "010 km North of Malungon (Sarangani)"
 *   "006 km S 29° W of Licuan"            (no province)
 */
export function parsePhivolcsPlace(text: string): ParsedQuakePlace | null {
  const m = text
    .trim()
    .match(/^(\d{1,4})\s*km\s+(?:([NS])\s*(\d{1,2})\s*°\s*([EW])|(North|South|East|West))\s+of\s+(.+?)\s*$/i);
  if (!m) return null;
  const km = Number(m[1]);
  const compass = m[5] ? WORD_BEARING[m[5].toLowerCase()] : quadrantToCompass(m[2], Number(m[3]), m[4]);
  if (!compass) return null;
  // Last "(...)" is the province; anything before it stays as written.
  const named = m[6].match(/^(.+?)\s*\(([^()]+)\)$/);
  const town = (named ? named[1] : m[6]).trim();
  const province = named?.[2].trim();
  if (!town) return null;
  return {
    place: province ? `${town}, ${province}` : town,
    offset: km >= 1 ? `${km} km ${compass}` : null,
  };
}

/** USGS "45 km SSW of Sarangani, Philippines". */
export function parseUsgsPlace(text: string): ParsedQuakePlace | null {
  const m = text.trim().match(/^(\d{1,4})\s*km\s+([NSEW]{1,3})\s+of\s+(.+?)\s*$/);
  if (!m) return null;
  const place = m[3].replace(/,\s*Philippines$/i, "").trim();
  if (!place) return null;
  const km = Number(m[1]);
  return { place, offset: km >= 1 ? `${km} km ${m[2]}` : null };
}

/** "M5.1 · Valderrama, Antique (12 km SE)", or "M5.1 · <raw text>". */
export function quakeTitle(magnitude: number, placeText: string, parsed: ParsedQuakePlace | null): string {
  const mag = `M${magnitude.toFixed(1)}`;
  if (!parsed) return `${mag} · ${placeText.trim()}`;
  return parsed.offset ? `${mag} · ${parsed.place} (${parsed.offset})` : `${mag} · ${parsed.place}`;
}
