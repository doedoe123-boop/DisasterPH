"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { HAZARD_COLORS, SEVERITY_RING } from "@/lib/mapbox";
import { RAIN_COLORS, VOLCANO_LEVEL_COLORS, VOLCANO_LEVEL_TEXT } from "@/lib/map-event-layers";
import { severityText, t, type Locale } from "@/lib/i18n";

/** A small copy of the volcano marker: triangle with the alert level. */
function TriangleSwatch({ level }: { level: number }) {
  return (
    <svg aria-hidden width="22" height="20" viewBox="0 0 22 20" className="shrink-0">
      <path d="M11 1.5 L20.5 18.5 L1.5 18.5 Z" fill={VOLCANO_LEVEL_COLORS[level]} stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      <text x="11" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill={VOLCANO_LEVEL_TEXT[level]}>{level}</text>
    </svg>
  );
}

/** A small copy of a map marker: coloured disc with its label (and ring). */
function MarkerSwatch({ color, label, ring = color, size = 22 }: { color: string; label: string; ring?: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-black"
      style={{ width: size, height: size, background: color, border: `2px solid ${ring}` }}
    >
      {label}
    </span>
  );
}

/**
 * What the map's marks mean (marker design in src/lib/map-event-layers.ts).
 * Every mark carries a number or shape, so colour is never the only cue.
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
    // Closed: between the map's top controls and the list panel. Open: the
    // full map height (over the toolbar and the phone list panel), so it
    // isn't a cramped box on phones; closing it brings them back.
    <div className={`map-legend pointer-events-none absolute left-3 ${expanded ? "bottom-3 top-3 z-30" : "bottom-[calc(var(--map-bottom-inset,0px)+0.75rem)] top-[calc(var(--map-toolbar-h,0px)+6rem)] z-10"} flex max-w-[calc(100%-1.5rem)] flex-col items-start justify-end lg:left-[calc(var(--map-left-inset)+0.75rem)]`}>
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
            <MarkerSwatch color={HAZARD_COLORS.earthquake} ring={SEVERITY_RING.watch} label="4.6" />
            <span>{copy.earthquake}</span>
          </li>
          <li className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: "#1f2937", border: `2px solid ${HAZARD_COLORS.earthquake}` }}
            >
              12
            </span>
            <span>{copy.cluster}</span>
          </li>
          <li className="flex items-center gap-2">
            <TriangleSwatch level={3} />
            <span>{copy.volcano}</span>
          </li>
          <li className="flex items-center gap-1 pl-[30px]" aria-label={copy.volcanoLevels}>
            {[1, 2, 3, 4, 5].map((level) => (
              <TriangleSwatch key={level} level={level} />
            ))}
          </li>
          <li className="flex items-center gap-2">
            <MarkerSwatch color={HAZARD_COLORS.typhoon} label="2" />
            <span>{copy.typhoon}</span>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden className="flex w-[22px] shrink-0 items-center justify-center gap-px">
              {(["ev-rain-red", "ev-rain-orange", "ev-rain-yellow"] as const).map((k) => (
                <span key={k} className="inline-block h-[13px] w-[7px] rounded-b-full rounded-t-[40%]" style={{ background: RAIN_COLORS[k] }} />
              ))}
            </span>
            <span>{copy.rain}</span>
          </li>
          <li className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex h-[20px] w-[22px] shrink-0 items-center justify-center rounded-[5px] text-[8.5px] font-bold text-white"
              style={{ background: RAIN_COLORS["ev-basin"] }}
            >
              FW
            </span>
            <span>{copy.basin}</span>
          </li>
          <li className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex h-[20px] w-[22px] shrink-0 rotate-45 scale-[0.8] items-center justify-center rounded-[3px]"
              style={{ background: RAIN_COLORS["ev-tsunami-warning"] }}
            >
              <span className="-rotate-45 text-[8px] font-bold text-white">TW</span>
            </span>
            <span>{copy.tsunami}</span>
          </li>
        </ul>
        <p className="mt-2.5 flex items-center gap-2">
          <span aria-hidden className="flex w-[22px] shrink-0 items-center gap-0.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: HAZARD_COLORS.earthquake }} />
            <span className="inline-block h-2.5 w-2.5 rounded-full opacity-45" style={{ background: HAZARD_COLORS.earthquake }} />
          </span>
          <span>{copy.age}</span>
        </p>
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
        <p className="mt-3 text-[11px] font-semibold leading-4 text-[var(--text-muted)]">{copy.levelsTitle}</p>
        <dl className="mt-1 space-y-0.5 text-[11px] leading-4">
          {severities.map((sev) => (
            <div key={sev.key} className="flex gap-1.5">
              <dt className="shrink-0 font-semibold">{sev.label}:</dt>
              <dd className="text-[var(--text-muted)]">{copy.levelDefs[sev.key]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[11px] leading-4 text-[var(--text-muted)]">{copy.official}</p>
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
