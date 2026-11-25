import type { Incident } from "@/types/incident";
import { fetchPhivolcs } from "./https-text";
import type { IntensityGroup } from "@/lib/quake-intensity";

export { bulletinVersion } from "@/lib/quake-intensity";

/**
 * Details from a PHIVOLCS earthquake bulletin ("Earthquake Information
 * No. N"), the page each row of the earthquake list links to. The list has
 * time, place, depth and magnitude; the bulletin adds what people need most:
 * where the shaking was felt and how strongly, whether PHIVOLCS expects damage
 * and aftershocks, and an epicentre map image.
 *
 * Bulletins are Word-exported HTML in windows-1252. They are fetched only when
 * someone opens that earthquake's page, and cached by URL: PHIVOLCS gives a
 * revised bulletin a new file name (…_B1.html, …_B2F.html), so one URL always
 * means one version.
 *
 * If a bulletin cannot be read, the earthquake page shows what it showed
 * before plus the link to the bulletin. Nothing here replaces list data.
 */

export interface EqBulletin {
  /** When PHIVOLCS issued this bulletin, ISO (UTC). */
  issuedAt: string | null;
  /** "TECTONIC", "VOLCANIC", … */
  origin: string | null;
  /** "Mw 5.1", "Ms 4.2": magnitude with its type, verbatim. */
  magnitudeText: string | null;
  expectingDamage: boolean | null;
  expectingAftershocks: boolean | null;
  /** Intensities people reported, strongest first. */
  reported: IntensityGroup[];
  /** Intensities PHIVOLCS's instruments measured, strongest first. */
  instrumental: IntensityGroup[];
  /** e.g. "This is an aftershock of the 2026 June Mw7.8 … earthquake." */
  remarks: string | null;
  /** The epicentre map image next to the bulletin (https, PHIVOLCS host). */
  mapUrl: string | null;
}

const ROMAN: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
};

/** Month by its first three letters ("Nov" and "November" both appear). */
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Bulletin bytes -> text, using the charset the page declares. */
export function decodeBulletin(bytes: Buffer): string {
  const head = bytes.subarray(0, 4096).toString("latin1");
  const declared = head.match(/charset=["']?([\w-]+)/i)?.[1]?.toLowerCase();
  const charset = declared === "utf-8" || declared === "utf8" ? "utf-8" : "windows-1252";
  return new TextDecoder(charset).decode(bytes);
}

const SMALL_WORDS = new Set(["of", "de", "del", "la", "las", "los", "and", "y"]);

/** "NEGROS OCCIDENTAL" -> "Negros Occidental", "CITY OF BACOLOD" -> "City of Bacolod". */
function titleCaseCaps(text: string): string {
  return text.replace(/\b[A-ZÑ][A-ZÑ.'-]*(?:\s+[A-ZÑ][A-ZÑ.'-]*)*\b/g, (run) => {
    // Leave single short tokens alone (e.g. "I", roman numerals, "N").
    if (!/[A-ZÑ]{3,}/.test(run)) return run;
    return run
      .toLowerCase()
      .split(/(\s+)/)
      .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.replace(/^\p{L}/u, (c) => c.toUpperCase())))
      .join("");
  });
}

/** "25 November 2026 - 08:30 AM" (Philippine Time) -> ISO. */
function parseIssued(value: string): string | null {
  const m = value.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
  const hour12 = Number(m[4]);
  if (month === undefined || hour12 < 1 || hour12 > 12) return null;
  const hour = (hour12 % 12) + (m[6].toUpperCase() === "PM" ? 12 : 0);
  return new Date(Date.UTC(+m[3], month, +m[1], hour, +m[5]) - 8 * 3_600_000).toISOString();
}

function yesNo(value: string | undefined): boolean | null {
  if (!value) return null;
  if (/^yes\b/i.test(value)) return true;
  if (/^no\b/i.test(value)) return false;
  return null;
}

/** Map image file name from the bulletin -> absolute URL next to it, else null. */
function mapImageUrl(src: string | undefined, bulletinUrl: string): string | null {
  const file = src?.trim();
  if (!file || !/^[\w-]+\.jpe?g$/i.test(file)) return null;
  try {
    const url = new URL(file, bulletinUrl);
    const base = new URL(bulletinUrl);
    return url.protocol === "https:" && url.hostname === base.hostname ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Parse a bulletin page. Throws if it doesn't look like a PHIVOLCS
 * earthquake bulletin.
 */
export function parseEqBulletin(html: string, bulletinUrl: string): EqBulletin {
  if (!/EARTHQUAKE INFORMATION/i.test(html) || !/Expecting/i.test(html)) {
    throw new Error("PHIVOLCS bulletin layout not recognised");
  }
  const start = html.search(/<body/i);
  const lines = html
    .slice(start < 0 ? 0 : start)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(br|\/p|\/tr|\/td|\/div|\/h\d)\b[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t\r ]+/g, " ")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  // Labels wrap over several lines in these Word exports ("Expecting" /
  // "Damage :"), so match on the joined text for the single-value fields.
  const flat = lines.join(" ");
  const field = (label: RegExp) => flat.match(label)?.[1]?.trim();

  const origin = field(/Origin\s*:\s*([A-Z]+)/i) ?? null;
  const magnitudeText = field(/Magnitude\s*:\s*((?:M[a-z]{0,2}\s*)?\d+(?:\.\d+)?)/i) ?? null;
  const expectingDamage = yesNo(field(/Expecting\s+Damage\s*:\s*(\w+)/i));
  const expectingAftershocks = yesNo(field(/Expecting\s+Aftershocks\s*:\s*(\w+)/i));
  const issuedAt = parseIssued(field(/Issued\s+On\s*:\s*(\d{1,2}\s+\w+\s+\d{4}\s*-\s*\d{1,2}:\d{2}\s*[AP]M)/i) ?? "");

  // Intensity block: between "Reported Intensities" and "Expecting Damage".
  const from = lines.findIndex(
    (l, i) =>
      /^Reported\s+Intensities/i.test(l) ||
      (/^Intensities\s*:?$/i.test(l) && /^Reported$/i.test(lines[i - 1] ?? "")),
  );
  const to = lines.findIndex((l, i) => i > from && /^Expecting\b/i.test(l));
  const reported: IntensityGroup[] = [];
  const instrumental: IntensityGroup[] = [];
  const remarks: string[] = [];
  if (from >= 0 && to > from) {
    let target = reported;
    let current: IntensityGroup | null = null;
    let inRemark = false;
    for (const line of lines.slice(from + 1, to)) {
      // PHIVOLCS's internal form version and file code ("11.20a", "2026_1124_2329_M51D019_B2F").
      if (/^\d+\.\d+[a-z]?$/i.test(line) || /^\d{4}_\d{4}_\d{4}_M\d+D\d+/i.test(line)) continue;
      if (/^Instrumental\s+Intensit(?:y|ies)\s*:?$/i.test(line)) {
        target = instrumental;
        current = null;
        inRemark = false;
        continue;
      }
      const m = line.match(/^Intensity\s+([IVX]+)\s*[-–:]\s*(.*)$/i);
      if (m && ROMAN[m[1].toUpperCase()]) {
        current = { level: ROMAN[m[1].toUpperCase()], places: m[2] };
        target.push(current);
        inRemark = false;
        continue;
      }
      // Sentences are remarks ("This is an aftershock of …"); anything else
      // continues the place list that wrapped onto this line.
      if (inRemark || /^(This|The|An?|It)\b/.test(line) || !current) {
        remarks.push(line);
        inRemark = true;
        current = null;
        continue;
      }
      current.places = `${current.places} ${line}`;
    }
  }
  const tidy = (groups: IntensityGroup[]) =>
    groups
      .map((g) => ({
        level: g.level,
        places: titleCaseCaps(g.places.replace(/\s*,\s*/g, ", ").replace(/\s*;\s*/g, "; ").replace(/[;,\s]+$/, "").trim()),
      }))
      .filter((g) => g.places.length > 0)
      .sort((a, b) => b.level - a.level);

  const src = html.match(/<img\b[^>]*?\bsrc\s*=\s*"\s*([^"]+?)\s*"/i)?.[1];

  return {
    issuedAt,
    origin: origin ? origin.toUpperCase() : null,
    magnitudeText: magnitudeText ? magnitudeText.replace(/\s+/g, " ") : null,
    expectingDamage,
    expectingAftershocks,
    reported: tidy(reported),
    instrumental: tidy(instrumental),
    remarks: remarks.length ? remarks.join(" ").slice(0, 500) : null,
    mapUrl: mapImageUrl(src, bulletinUrl),
  };
}

/** Flat incident metadata (metadata values must be primitives). */
export function eqBulletinMetadata(b: EqBulletin): Incident["metadata"] {
  const groups = (g: IntensityGroup[]) => g.map((x) => `${x.level}|${x.places}`).join("\n") || null;
  return {
    eq_bulletin_loaded: true,
    eq_issued_at: b.issuedAt,
    eq_origin: b.origin,
    eq_magnitude_text: b.magnitudeText,
    eq_expecting_damage: b.expectingDamage,
    eq_expecting_aftershocks: b.expectingAftershocks,
    eq_reported_intensities: groups(b.reported),
    eq_instrumental_intensities: groups(b.instrumental),
    eq_remarks: b.remarks,
    eq_map_url: b.mapUrl,
  };
}

/* ── Fetching with a small cache ── */

const OK_TTL_MS = 6 * 3_600_000;
const FAIL_TTL_MS = 5 * 60_000;
const MAX_ENTRIES = 300;
const cache = new Map<string, { value: EqBulletin | null; at: number }>();
const inFlight = new Map<string, Promise<EqBulletin | null>>();

/** Replaceable in tests. */
export const bulletinFetcher = {
  fetch: async (url: string): Promise<EqBulletin> => {
    const res = await fetchPhivolcs(url, { timeoutMs: 10_000, maxBytes: 1024 * 1024 });
    if (res.status !== 200) throw new Error(`PHIVOLCS bulletin returned ${res.status}`);
    return parseEqBulletin(decodeBulletin(res.body), url);
  },
};

/** The bulletin at `url`, from cache or PHIVOLCS; null if it can't be read. */
export async function loadEqBulletin(url: string, now = Date.now()): Promise<EqBulletin | null> {
  const hit = cache.get(url);
  if (hit && now - hit.at < (hit.value ? OK_TTL_MS : FAIL_TTL_MS)) return hit.value;
  const pending = inFlight.get(url);
  if (pending) return pending;
  const job = bulletinFetcher
    .fetch(url)
    .catch((error: unknown) => {
      console.warn("[phivolcs] bulletin unreadable:", url, error instanceof Error ? error.message : error);
      return null;
    })
    .then((value) => {
      if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
      cache.set(url, { value, at: Date.now() });
      return value;
    })
    .finally(() => inFlight.delete(url));
  inFlight.set(url, job);
  return job;
}

export function clearEqBulletinCache(): void {
  cache.clear();
  inFlight.clear();
}

/**
 * A PHIVOLCS earthquake with its bulletin details merged into metadata.
 * Anything else (or an unreadable bulletin) comes back unchanged.
 */
export async function withEqBulletin(incident: Incident): Promise<Incident> {
  const url = incident.metadata.bulletin_url;
  if (incident.source !== "PHIVOLCS" || incident.event_type !== "earthquake" || typeof url !== "string") {
    return incident;
  }
  const bulletin = await loadEqBulletin(url);
  if (!bulletin) return incident;
  return { ...incident, metadata: { ...incident.metadata, ...eqBulletinMetadata(bulletin) } };
}
