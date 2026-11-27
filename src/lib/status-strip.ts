import type { Incident, SourceStatus } from "@/types/incident";
import { t, type Locale } from "@/lib/i18n";

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
  /** The highest PAGASA Heavy Rainfall Warning level in effect, with its areas (as published). */
  rainTop: { level: string; areas: string; more: number } | null;
  /** River basins not on "Non-Flood Watch", grouped by PAGASA's status. */
  basins: Array<{ status: string; names: string[] }>;
  /** PAGASA's national Weather Advisory in effect. */
  weatherAdvisory: number | null;
  /** PAGASA's rainfall pages could not be read and nothing is known. */
  rainUnknown: boolean;
  /** PHIVOLCS tsunami warnings and advisories in effect: heading and areas, as published. */
  tsunamis: Array<{ heading: string; areas: string[] }>;
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
  const rain = incidents.filter((i) => i.source === "PAGASA" && i.metadata.product === "rainfall_warning" && typeof i.metadata.warning_level === "string");
  const order: Record<string, number> = { Red: 3, Orange: 2, Yellow: 1 };
  const top = [...rain].sort((a, b) => (order[String(b.metadata.warning_level)] ?? 0) - (order[String(a.metadata.warning_level)] ?? 0))[0];
  const basinMap = new Map<string, string[]>();
  for (const i of incidents) {
    if (i.source !== "PAGASA" || i.metadata.product !== "basin") continue;
    const status = String(i.metadata.basin_status ?? "");
    basinMap.set(status, [...(basinMap.get(status) ?? []), String(i.metadata.basin_name ?? i.title)]);
  }
  const rainSource = sources.find((x) => x.source === "PAGASA_RAIN");
  const rainEvents = incidents.filter((i) => i.source === "PAGASA" && i.event_type === "flood");
  const tsunamis = incidents
    .filter((i) => i.event_type === "tsunami")
    .map((i) => ({
      heading: String(i.metadata.tsunami_heading ?? ""),
      areas: typeof i.metadata.tsunami_areas === "string" ? i.metadata.tsunami_areas.split("\n").filter(Boolean) : [],
    }));
  return {
    tsunamis,
    rainTop: top
      ? { level: String(top.metadata.warning_level), areas: String(top.metadata.level_areas ?? ""), more: rain.length - 1 }
      : null,
    basins: [...basinMap].map(([status, names]) => ({ status, names })),
    weatherAdvisory: rainSource?.weather_advisory?.number ?? null,
    rainUnknown: !ok("PAGASA_RAIN") && rainEvents.length === 0,
    namedVolcanoes: named,
    levelOneCount: volcanoes.filter((i) => Number(i.metadata.alert_level) === 1).length,
    volcanoUnknown: !ok("PHIVOLCS_VOLCANO") && volcanoes.length === 0,
    quakesM4Last24h: quakes.length,
    quakesUnknown: !ok("PHIVOLCS") && !ok("USGS"),
    cyclones,
    cyclonesUnknown: !ok("PAGASA") && cyclones.length === 0,
  };
}

/** The strip as one line of text (the page and shared-link previews). */
export function statusText(incidents: Incident[], sources: SourceStatus[], locale: Locale, now: number = Date.now()): string {
  const copy = t(locale).common.statusStrip;
  const p = statusParts(incidents, sources, now);
  const parts: string[] = [];
  // A tsunami warning or advisory comes first.
  for (const ts of p.tsunamis) {
    const areas = ts.areas.length > 3 ? `${ts.areas.slice(0, 3).join(", ")} +${ts.areas.length - 3}` : ts.areas.join(", ");
    parts.push(copy.tsunami.replace("{heading}", ts.heading).replace("{areas}", areas));
  }

  if (p.volcanoUnknown) parts.push(copy.volcanoUnknown);
  else {
    for (const v of p.namedVolcanoes) parts.push(copy.volcanoNamed.replace("{name}", v.name).replace("{n}", String(v.level)));
    if (p.levelOneCount > 0) parts.push(copy.volcanoLevelOne.replace("{n}", String(p.levelOneCount)));
  }

  if (p.quakesUnknown) parts.push(copy.quakesUnknown);
  else
    parts.push(
      p.quakesM4Last24h === 0
        ? copy.quakesNone
        : p.quakesM4Last24h === 1
          ? copy.quakesOne
          : copy.quakesMany.replace("{n}", String(p.quakesM4Last24h)),
    );

  if (p.cyclones.length > 0) {
    for (const c of p.cyclones)
      parts.push(
        c.signal > 0
          ? copy.cyclone.replace("{name}", c.name).replace("{n}", String(c.signal))
          : copy.cycloneNoSignal.replace("{name}", c.name),
      );
  } else parts.push(p.cyclonesUnknown ? copy.cycloneUnknown : copy.noCyclone);

  // Rain and floods: only what PAGASA has in effect (nothing when none).
  if (p.rainTop) {
    const text = copy.rainWarning.replace("{level}", p.rainTop.level).replace("{areas}", p.rainTop.areas);
    parts.push(p.rainTop.more > 0 ? copy.rainMore.replace("{text}", text).replace("{n}", String(p.rainTop.more)) : text);
  }
  for (const b of p.basins) {
    parts.push(
      b.names.length === 1
        ? copy.basinOne.replace("{status}", b.status).replace("{name}", b.names[0])
        : copy.basinMany.replace("{status}", b.status).replace("{n}", String(b.names.length)),
    );
  }
  if (p.weatherAdvisory) parts.push(copy.weatherAdvisory.replace("{n}", String(p.weatherAdvisory)));
  if (p.rainUnknown) parts.push(copy.rainUnknown);

  return parts.join(" · ");
}
