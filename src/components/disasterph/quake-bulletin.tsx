"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle, ExternalLink } from "lucide-react";
import type { Incident } from "@/types/incident";
import { t, type Locale } from "@/lib/i18n";
import { formatPHT, sourceInfo } from "@/lib/source-info";
import {
  ROMAN_NUMERALS,
  bulletinVersion,
  intensityGroups,
  type IntensityGroup,
} from "@/lib/quake-intensity";

/** Intensity badge colours: stronger shaking, warmer colour. */
function intensityTone(level: number): string {
  if (level >= 7) return "border-red-500/50 bg-red-500/15 text-red-300 quake-int-strong";
  if (level >= 5) return "border-orange-500/45 bg-orange-500/12 text-orange-300 quake-int-mid";
  if (level >= 3) return "border-amber-500/40 bg-amber-500/10 text-amber-300 quake-int-low";
  return "border-overlay/15 bg-overlay/[0.04] text-[var(--text-muted)]";
}

function IntensityList({
  title,
  groups,
  locale,
}: {
  title: string;
  groups: IntensityGroup[];
  locale: Locale;
}) {
  const copy = t(locale).common.quake;
  return (
    <div className="mt-4">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">{title}</p>
      <ul className="mt-2 space-y-2">
        {groups.map((g) => (
          <li key={`${g.level}-${g.places}`} className="grid grid-cols-[5.5rem_1fr] items-start gap-3 text-sm">
            <span
              className={`rounded-md border px-2 py-0.5 text-center text-[11.5px] font-bold ${intensityTone(g.level)}`}
              title={copy.scale[g.level]}
            >
              {copy.intensity.replace("{n}", ROMAN_NUMERALS[g.level])}
            </span>
            <span className="leading-6 text-[var(--text-primary)]">
              <span className="font-semibold">{copy.scale[g.level]}</span>
              <span className="text-[var(--text-muted)]"> · </span>
              {g.places}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Details from the PHIVOLCS earthquake bulletin: expected damage and
 * aftershocks, where the shaking was felt (reported and measured), and the
 * PHIVOLCS epicentre map. Text is rendered as plain text (React escapes it).
 */
export function QuakeBulletin({ incident, locale }: { incident: Incident; locale: Locale }) {
  const copy = t(locale).common.quake;
  const m = incident.metadata;
  const [mapFailed, setMapFailed] = useState(false);
  const recordUrl = sourceInfo(incident).recordUrl;

  if (m.eq_bulletin_loaded !== true) {
    if (!recordUrl) return null;
    return (
      <div className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">{copy.heading}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{copy.unavailable}</p>
        <a
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-cyan-400 hover:text-cyan-300"
          href={recordUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {copy.readBulletin}
        </a>
      </div>
    );
  }

  const reported = intensityGroups(m.eq_reported_intensities);
  const instrumental = intensityGroups(m.eq_instrumental_intensities);
  const yesNo = (v: unknown) => (v === true ? copy.yes : v === false ? copy.no : copy.unknown);
  const version = bulletinVersion(m.bulletin_url);
  const mapSrc =
    typeof m.eq_map_url === "string" && version
      ? `/api/quake-map/${encodeURIComponent(incident.id)}/${version}`
      : null;
  const issued = typeof m.eq_issued_at === "string" ? m.eq_issued_at : null;

  return (
    <div className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">{copy.heading}</h2>
      <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
        {m.bulletin_no != null ? copy.bulletinNo.replace("{no}", String(m.bulletin_no)) : copy.heading}
        {typeof m.eq_magnitude_text === "string" ? ` · ${m.eq_magnitude_text}` : ""}
      </p>
      {issued && (
        <p className="mt-0.5 text-[12px] text-[var(--text-muted)]" suppressHydrationWarning>
          {copy.issued.replace("{time}", formatPHT(issued))}
        </p>
      )}

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div
          className={`rounded-lg border p-3 ${
            m.eq_expecting_damage === true
              ? "quake-damage-yes border-red-500/40 bg-red-500/10"
              : "border-overlay/8 bg-overlay/[0.02]"
          }`}
        >
          <dt className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">{copy.damage}</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-base font-bold text-[var(--text-primary)]">
            {m.eq_expecting_damage === true && <AlertTriangle aria-hidden className="h-4 w-4 text-red-400" />}
            {yesNo(m.eq_expecting_damage)}
          </dd>
        </div>
        <div className="rounded-lg border border-overlay/8 bg-overlay/[0.02] p-3">
          <dt className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">{copy.aftershocks}</dt>
          <dd className="mt-1 text-base font-bold text-[var(--text-primary)]">{yesNo(m.eq_expecting_aftershocks)}</dd>
        </div>
        {typeof m.eq_origin === "string" && (
          <div className="rounded-lg border border-overlay/8 bg-overlay/[0.02] p-3">
            <dt className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">{copy.origin}</dt>
            <dd className="mt-1 text-base font-bold capitalize text-[var(--text-primary)]">{m.eq_origin.toLowerCase()}</dd>
          </div>
        )}
      </dl>

      {typeof m.eq_remarks === "string" && (
        <p className="mt-3 text-sm leading-6 text-[var(--text-primary)]">{m.eq_remarks}</p>
      )}

      {reported.length > 0 && <IntensityList title={copy.reported} groups={reported} locale={locale} />}
      {instrumental.length > 0 && <IntensityList title={copy.instrumental} groups={instrumental} locale={locale} />}
      {reported.length === 0 && instrumental.length === 0 && (
        <p className="mt-4 text-sm text-[var(--text-muted)]">{copy.noIntensities}</p>
      )}
      {(reported.length > 0 || instrumental.length > 0) && (
        <p className="mt-2 text-[11.5px] text-[var(--text-dim)]">{copy.scaleNote}</p>
      )}

      {mapSrc && !mapFailed && (
        <figure className="mt-5">
          <a href={typeof m.eq_map_url === "string" ? m.eq_map_url : undefined} target="_blank" rel="noopener noreferrer">
            <Image
              src={mapSrc}
              alt={copy.mapAlt}
              width={1286}
              height={825}
              sizes="(min-width: 1024px) 680px, 100vw"
              className="h-auto w-full rounded-lg border border-overlay/10 bg-overlay/[0.03]"
              onError={() => setMapFailed(true)}
            />
          </a>
          <figcaption className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[var(--text-dim)]">
            <span>{copy.mapCredit}</span>
            {typeof m.eq_map_url === "string" && (
              <a
                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                href={m.eq_map_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3" />
                {copy.mapOpen}
              </a>
            )}
          </figcaption>
        </figure>
      )}
    </div>
  );
}
