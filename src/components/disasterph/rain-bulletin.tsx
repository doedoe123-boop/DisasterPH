"use client";

import { CloudRain, ExternalLink } from "lucide-react";
import type { Incident } from "@/types/incident";
import { t, type Locale } from "@/lib/i18n";
import { eventTimeFull } from "@/lib/event-time";

function lines(value: unknown): string[] {
  return typeof value === "string" ? value.split("\n").map((s) => s.trim()).filter(Boolean) : [];
}

/** Only https links on PAGASA hosts. */
function pagasaLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)pagasa\.dost\.gov\.ph$/.test(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * The official PAGASA rainfall warning, rainfall advisory or river basin
 * status, in PAGASA's words, with DisasterPH's own notes kept apart. Plain
 * text only (React escapes it).
 */
export function RainBulletin({ incident, locale }: { incident: Incident; locale: Locale }) {
  const copy = t(locale).common.card;
  const m = incident.metadata;
  const basin = m.product === "basin";
  const level = typeof m.warning_level === "string" ? m.warning_level : null;
  const product = basin ? null : m.product === "rainfall_warning" ? "Heavy Rainfall Warning" : "Rainfall Advisory";
  const link = pagasaLink(m.bulletin_url);
  const sections: Array<{ title: string; items: string[] }> = [];
  if (basin) {
    if (typeof m.forecast_water === "string") sections.push({ title: copy.forecastWater, items: [m.forecast_water] });
    if (typeof m.forecast_rain === "string") sections.push({ title: copy.forecastRain, items: [m.forecast_rain] });
    if (typeof m.observed_rain === "string") sections.push({ title: copy.observedRain, items: [m.observed_rain] });
  } else {
    if (typeof m.hazard === "string") sections.push({ title: copy.hazardPagasa, items: [m.hazard] });
    const body = lines(m.body);
    if (body.length) sections.push({ title: level ? copy.alsoInWarning : copy.advisoryAreas, items: body });
    if (typeof m.advice === "string") sections.push({ title: copy.pagasaAdvice, items: [m.advice] });
  }
  const notes: string[] = [
    m.bulletin_stale === true ? copy.staleWarning : null,
    basin && sections.length === 0 ? copy.basinPdf : null,
    basin ? copy.basinAreasOurs : m.location_approx === true ? copy.approxPlace : null,
  ].filter((n) => n !== null) as string[];

  return (
    <section className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-5" aria-labelledby="rain-bulletin-title">
      <h2 id="rain-bulletin-title" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
        <CloudRain aria-hidden className="h-4 w-4" />
        {basin ? String(m.basin_name ?? incident.title) : `${product}${m.product_no != null ? ` No. ${m.product_no}` : ""}`}
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {level && (
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">{copy.rainLevel}</dt>
            <dd className="font-semibold">{level}</dd>
          </div>
        )}
        {basin && (
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">{copy.basinStatus}</dt>
            <dd className="font-semibold">{String(m.basin_status ?? "")}</dd>
          </div>
        )}
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">
            {basin && m.time_kind !== "issued" ? copy.firstSeen : copy.issued}
          </dt>
          <dd className="font-semibold" suppressHydrationWarning>{eventTimeFull(incident, locale)}</dd>
        </div>
        {typeof m.level_areas === "string" && (
          <div className="col-span-2">
            <dt className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">{copy.rainAreas}</dt>
            <dd className="font-semibold">{m.level_areas}</dd>
          </div>
        )}
        {(typeof m.office === "string" || typeof m.weather_system === "string") && (
          <div className="col-span-2 text-[13px] text-[var(--text-muted)]">
            {[m.office, m.weather_system].filter((v) => typeof v === "string").join(" · ")}
          </div>
        )}
      </dl>
      {sections.map((s) => (
        <div key={s.title} className="mt-4 text-sm leading-6">
          <p className="font-semibold">{s.title}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {s.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ))}
      {notes.length > 0 && (
        <ul className="mt-4 space-y-1 text-[12.5px] text-[var(--text-muted)]">
          {notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      )}
      {link && (
        <a
          className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
          href={link}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden className="h-4 w-4" />
          {copy.officialBulletin}
        </a>
      )}
    </section>
  );
}
