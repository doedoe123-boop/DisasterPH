/**
 * Earthquake bulletin helpers shared by the server (ingest) and the page.
 * No server-only imports here.
 */

export interface IntensityGroup {
  /** PHIVOLCS Earthquake Intensity Scale, 1–10. */
  level: number;
  /** Places at that intensity, as PHIVOLCS lists them (provinces in title case). */
  places: string;
}

export const ROMAN_NUMERALS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/** Reads `eq_*_intensities` metadata ("5|Barbaza, Antique\n4|…") back into groups. */
export function intensityGroups(value: unknown): IntensityGroup[] {
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((line) => {
      const [level, ...rest] = line.split("|");
      return { level: Number(level), places: rest.join("|") };
    })
    .filter((g) => Number.isInteger(g.level) && g.level >= 1 && g.level <= 10 && g.places.length > 0);
}

/** File part of a bulletin URL ("2026_1124_232954_B2F"); identifies the version. */
export function bulletinVersion(url: unknown): string | null {
  if (typeof url !== "string") return null;
  return url.match(/\/([\w-]+)\.html?$/i)?.[1] ?? null;
}
