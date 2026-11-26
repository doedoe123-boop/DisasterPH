import type { Incident } from "@/types/incident";

/**
 * Regions an official warning names as affected, besides the event's own
 * region: a tropical cyclone's PAGASA wind-signal areas ("signal_regions"),
 * or the provinces of a PAGASA rainfall warning, rainfall advisory or river
 * basin ("warning_regions"). Used for "your area" and saved places.
 */
export function namedRegions(incident: Incident): string[] {
  const out: string[] = [];
  for (const key of ["signal_regions", "warning_regions"] as const) {
    const v = incident.metadata?.[key];
    if (typeof v === "string" && v) out.push(...v.split("|"));
  }
  return [...new Set(out)];
}
