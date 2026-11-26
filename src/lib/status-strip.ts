import type { Incident, SourceStatus } from "@/types/incident";

/**
 * The factual status strip: counts and levels copied from official data,
 * nationwide, never combined into a score of our own.
 *
 *   "Mayon at Alert Level 3 · Kanlaon at Alert Level 2 · 2 at Alert Level 1"
 *   "12 earthquakes M4.0+ in the last 24 h"
 *   "No active tropical cyclone" / "Tropical cyclone Rosal: Signal No. 2"
 *
 * Each part is omitted rather than guessed when its source isn't readable.
 */

export interface StatusParts {
  /** Volcanoes at Alert Level 2+, named, highest first. */
  namedVolcanoes: Array<{ name: string; level: number }>;
  /** Volcanoes at Alert Level 1 (counted, not named). */
  levelOneCount: number;
  /** PHIVOLCS volcano data could not be read. */
  volcanoUnknown: boolean;
  /** Earthquakes M4.0+ that started in the last 24 hours. */
  quakesM4Last24h: number;
  /** Earthquake source could not be read (no count shown). */
  quakesUnknown: boolean;
  /** Active tropical cyclones with their highest wind signal (0 = none raised). */
  cyclones: Array<{ name: string; signal: number }>;
  /** PAGASA could not be read: don't claim "no active tropical cyclone". */
  cyclonesUnknown: boolean;
}

function volcanoName(incident: Incident): string {
  // Titles are "Mayon Volcano — Alert Level 3 (…)".
  return incident.title.split(" — ")[0].replace(/\s+Volcano$/i, "").trim() || incident.title;
}

function cycloneName(incident: Incident): string {
  const name = incident.metadata.tc_name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return incident.title.split(" — ")[0].trim();
}

export function statusParts(incidents: Incident[], sources: SourceStatus[], now: number = Date.now()): StatusParts {
  const ok = (key: string) => {
    const s = sources.find((x) => x.source === key);
    return Boolean(s && s.status !== "unavailable" && s.last_success_at);
  };
  const volcanoes = incidents.filter((i) => i.event_type === "volcano" && i.source === "PHIVOLCS");
  const named = volcanoes
    .map((i) => ({ name: volcanoName(i), level: Number(i.metadata.alert_level) || 0 }))
    .filter((v) => v.level >= 2)
    .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
  const since = now - 24 * 3_600_000;
  const quakes = incidents.filter((i) => {
    if (i.event_type !== "earthquake") return false;
    const t = Date.parse(i.started_at);
    return Number.isFinite(t) && t >= since && t <= now + 600_000 && Number(i.metadata.magnitude) >= 4.0;
  });
  const cyclones = incidents
    .filter((i) => i.event_type === "typhoon" && i.source === "PAGASA")
    .map((i) => ({ name: cycloneName(i), signal: Number(i.metadata.signal_number) || 0 }));
  return {
    namedVolcanoes: named,
    levelOneCount: volcanoes.filter((i) => Number(i.metadata.alert_level) === 1).length,
    volcanoUnknown: !ok("PHIVOLCS_VOLCANO") && volcanoes.length === 0,
    quakesM4Last24h: quakes.length,
    quakesUnknown: !ok("PHIVOLCS") && !ok("USGS"),
    cyclones,
    cyclonesUnknown: !ok("PAGASA") && cyclones.length === 0,
  };
}
