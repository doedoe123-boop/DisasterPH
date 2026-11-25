"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { HAZARD_COLORS, SEVERITY_RING } from "@/lib/mapbox";
import { severityText, t, type Locale } from "@/lib/i18n";

/** A small copy of a map marker: coloured disc with its label. */
function MarkerSwatch({ color, label, size = 22 }: { color: string; label: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-black"
      style={{ width: size, height: size, background: color, border: `2px solid ${color}` }}
    >
      {label}
    </span>
  );
}

/**
 * What the map's marks mean. Describes the current marker design: colour =
 * hazard type, size and ring = severity (also written as text in every popup
 * and list row, so colour is never the only cue).
 */
export function MapLegend({ locale }: { locale: Locale }) {
  const copy = t(locale).common.legend;
  // Starts closed on every screen: the map is often short (the feed and
  // filters take most of the height), and an open legend would cover it.
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const severities = (["advisory", "watch", "warning", "critical"] as const).map((key) => ({
    key,
    label: severityText(key, locale),
  }));

  return (
    // Spans from below the top-left map buttons to the bottom, so the open
    // panel never covers them; it scrolls when the map is short.
    <div className="map-legend pointer-events-none absolute bottom-3 left-3 top-24 z-10 flex max-w-[calc(100%-1.5rem)] flex-col items-start justify-end lg:left-[calc(var(--map-left-inset)+0.75rem)]">
      <div
        id={panelId}
        role="group"
        aria-label={copy.title}
        hidden={!expanded}
        className={`pointer-events-auto mb-1.5 min-h-0 w-[15.5rem] overflow-y-auto overscroll-contain rounded-xl border border-overlay/15 bg-[var(--bg-panel)]/95 p-3 text-[12px] leading-5 text-[var(--text-primary)] shadow-[var(--shadow-card)] backdrop-blur`}
      >
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-dim)]">{copy.title}</p>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2">
            <MarkerSwatch color={HAZARD_COLORS.earthquake} label="4.6" />
            <span>{copy.earthquake}</span>
          </li>
          <li className="flex items-center gap-2">
            <MarkerSwatch color={HAZARD_COLORS.volcano} label="VO" />
            <span>{copy.volcano}</span>
          </li>
          <li className="flex items-center gap-2">
            <MarkerSwatch color={HAZARD_COLORS.typhoon} label="TY" />
            <span>{copy.typhoon}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex w-[22px] shrink-0 items-end justify-center gap-0.5" aria-hidden>
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--text-dim)]" />
              <span className="inline-block h-4 w-4 rounded-full bg-[var(--text-dim)]" />
            </span>
            <span>{copy.size}</span>
          </li>
        </ul>
        <p className="mt-2.5 text-[11px] font-semibold text-[var(--text-muted)]">{copy.ringTitle}</p>
        <ul className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
          {severities.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ border: `2px solid ${SEVERITY_RING[s.key]}` }}
              />
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
        <ul className="mt-2.5 space-y-1.5">
          <li className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-[18px] w-[22px] shrink-0 rounded-full border-[1.5px] border-dashed"
              style={{ borderColor: HAZARD_COLORS.volcano, background: `${HAZARD_COLORS.volcano}22` }}
            />
            <span>{copy.dangerZone}</span>
          </li>
          <li className="flex items-center gap-2">
            <svg aria-hidden width="22" height="10" className="shrink-0">
              <line x1="1" y1="5" x2="11" y2="5" stroke={HAZARD_COLORS.typhoon} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="13" y1="5" x2="21" y2="5" stroke={HAZARD_COLORS.typhoon} strokeWidth="2" strokeDasharray="3 3" />
            </svg>
            <span>{copy.track}</span>
          </li>
        </ul>
        <p className="mt-2.5 text-[11px] leading-4 text-[var(--text-dim)]">{copy.note}</p>
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-controls={panelId}
        aria-expanded={expanded}
        className="pointer-events-auto flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-overlay/15 bg-[var(--bg-panel)]/95 px-3 text-[13px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-card)] backdrop-blur transition hover:bg-[var(--bg-panel)]"
      >
        <Info aria-hidden className="h-4 w-4" />
        {copy.title}
        {expanded ? (
          <ChevronDown aria-hidden className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp aria-hidden className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
