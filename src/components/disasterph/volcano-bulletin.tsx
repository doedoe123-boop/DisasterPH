"use client";

import { AlertTriangle, Ban, ExternalLink } from "lucide-react";
import type { Incident } from "@/types/incident";
import { t, type Locale } from "@/lib/i18n";
import { sourceInfo } from "@/lib/source-info";

const PARAM_KEYS = {
  seismicity: "Seismicity",
  so2_flux: "Sulfur Dioxide Flux",
  plume: "Plume",
  ground_deformation: "Ground Deformation",
} as const;

function lines(value: unknown): string[] {
  return typeof value === "string" ? value.split("\n").map((s) => s.trim()).filter(Boolean) : [];
}

/** "2026-11-23" -> "23 Nov 2026" (date only; bulletins are daily). */
function formatBulletinDate(value: string, locale: Locale): string {
  const d = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale === "fil" ? "fil-PH" : "en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

/**
 * The official PHIVOLCS daily bulletin for a volcano: what should not be
 * allowed, possible hazards and monitoring data, with its date. All text is
 * rendered as plain text (React escapes it).
 */
export function VolcanoBulletin({
  incident,
  locale,
}: {
  incident: Incident;
  locale: Locale;
}) {
  const copy = t(locale).common.volcano;
  const m = incident.metadata;
  const date = typeof m.bulletin_date === "string" ? m.bulletin_date : null;
  const notAllowed = lines(m.prohibited);
  const hazards = lines(m.hazards);
  const params = (Object.keys(PARAM_KEYS) as Array<keyof typeof PARAM_KEYS>)
    .map((key): { label: string; value: unknown } => ({ label: copy.params[PARAM_KEYS[key]], value: m[key] }))
    .filter((p): p is { label: string; value: string } => typeof p.value === "string" && p.value.length > 0);
  // Computed by the server at each refresh (bulletins are daily).
  const stale = !date || m.bulletin_stale === true;

  // English bulletin is stored; the Filipino one is the same page without lang=en.
  const recordUrl = sourceInfo(incident).recordUrl;
  const bulletinUrl =
    recordUrl && locale === "fil" ? recordUrl.replace(/[?&]lang=en\b/, "") : recordUrl;

  return (
    <div className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
        {copy.heading}
      </h2>
      <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
        {copy.alertLevel} {String(m.alert_level ?? "?")}
        {typeof m.alert_status === "string" && m.alert_status ? ` · ${m.alert_status}` : ""}
      </p>
      {date && (
        <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
          {copy.bulletinDate.replace("{date}", formatBulletinDate(date, locale))}
        </p>
      )}

      {(stale || m.level_mismatch === true) && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[12px] leading-5 text-amber-300" role="status">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {m.level_mismatch === true
              ? copy.mismatch
              : copy.stale.replace("{date}", date ? formatBulletinDate(date, locale) : "—")}
          </span>
        </p>
      )}

      {notAllowed.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-red-400">
            <Ban className="h-3.5 w-3.5" />
            {copy.notAllowed}
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--text-primary)]">
            {notAllowed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {hazards.length > 0 && (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {copy.hazards}
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--text-primary)]">
            {hazards.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {params.length > 0 && (
        <div className="mt-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">
            {copy.monitoring}
          </p>
          <dl className="mt-1.5 space-y-1.5 text-sm">
            {params.map((p) => (
              <div key={p.label} className="grid grid-cols-[minmax(0,10rem)_1fr] gap-3">
                <dt className="text-[var(--text-muted)]">{p.label}</dt>
                <dd className="text-[var(--text-primary)]">{p.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {bulletinUrl && (
        <a
          className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-cyan-400 hover:text-cyan-300"
          href={bulletinUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {copy.readBulletin}
        </a>
      )}
    </div>
  );
}
