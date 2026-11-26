"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Info, Layers, X } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { layerInfo } from "@/lib/layer-info";
import { QUAKE_RANGES, type LayerKey, type QuakeRange } from "@/lib/quake-filters";

export interface MapToolbarProps {
  locale: Locale;
  range: QuakeRange;
  onRange: (range: QuakeRange) => void;
  includeSmall: boolean;
  onIncludeSmall: (value: boolean) => void;
  layers: Record<LayerKey, boolean>;
  onLayer: (key: LayerKey, on: boolean) => void;
  /** Events per layer after the filters (for the panel). */
  counts: Record<LayerKey, number>;
  /** Show the "Other (NASA EONET)" row only when such events exist. */
  hasOther: boolean;
}

/**
 * Over the map: earthquake time chips (1h to 7d) and the Layers button. The
 * chips filter earthquakes only; volcano levels and cyclones always show.
 * Every control is at least 44px tall.
 */
export function MapToolbar(props: MapToolbarProps) {
  const { locale, range, onRange } = props;
  const copy = t(locale).common.mapFilters;
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Escape or a tap outside closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    // Spans the map's height, so the Layers panel below the row scrolls
    // within the map (on phones it opens over the list panel, like the legend).
    <div
      ref={wrapRef}
      className="map-toolbar pointer-events-none absolute bottom-3 left-3 right-16 top-3 z-30 flex flex-col items-start gap-1.5"
    >
      <div className="flex items-start gap-1.5">
      <div
        role="radiogroup"
        aria-label={copy.rangeLabel}
        className="pointer-events-auto flex shrink-0 overflow-hidden rounded-xl border border-overlay/15 bg-[var(--bg-panel)]/95 shadow-[var(--shadow-card)] backdrop-blur"
      >
        {QUAKE_RANGES.map(({ key }) => {
          const active = key === range;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${copy.rangeLabel} ${copy.rangeNames[key]}`}
              onClick={() => onRange(key)}
              className={`map-chip flex h-11 min-w-11 items-center justify-center px-2 text-[13px] font-semibold transition ${
                active
                  ? "is-active bg-orange-500 text-black"
                  : "text-[var(--text-muted)] hover:bg-overlay/8 hover:text-[var(--text-primary)]"
              }`}
            >
              {copy.ranges[key]}
            </button>
          );
        })}
      </div>
      <div className="pointer-events-auto relative shrink-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-overlay/15 bg-[var(--bg-panel)]/95 px-2.5 text-[13px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-card)] backdrop-blur transition hover:bg-[var(--bg-panel)]"
        >
          <Layers aria-hidden className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">{copy.layers}</span>
        </button>
      </div>
      </div>
      {open && <LayerPanel id={panelId} onClose={() => setOpen(false)} {...props} />}
    </div>
  );
}

function LayerPanel({
  id,
  onClose,
  locale,
  includeSmall,
  onIncludeSmall,
  layers,
  onLayer,
  counts,
  hasOther,
}: MapToolbarProps & { id: string; onClose: () => void }) {
  const copy = t(locale).common.mapFilters;
  const [infoOpen, setInfoOpen] = useState<LayerKey | null>(null);
  const keys: LayerKey[] = hasOther ? ["earthquake", "volcano", "typhoon", "other"] : ["earthquake", "volcano", "typhoon"];
  return (
    <div
      id={id}
      role="group"
      aria-label={copy.layersTitle}
      className="layer-panel pointer-events-auto min-h-0 w-[min(20rem,calc(100vw-1.5rem))] max-h-[28rem] overflow-y-auto overscroll-contain rounded-xl border border-overlay/15 bg-[var(--bg-panel)] p-3 text-[13px] text-[var(--text-primary)] shadow-[var(--shadow-elevated)]"
    >
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-dim)]">{copy.layersTitle}</p>
        <button type="button" onClick={onClose} aria-label={copy.close} className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--text-dim)] hover:bg-overlay/8">
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>
      <ul className="space-y-1">
        {keys.map((key) => {
          const info = layerInfo(key, locale);
          const name = copy.layerNames[key];
          return (
            <li key={key} className="rounded-lg border border-overlay/8 p-1.5">
              <div className="flex items-center gap-1">
                <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 px-1.5">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-orange-500"
                    checked={layers[key]}
                    onChange={(e) => onLayer(key, e.target.checked)}
                  />
                  <span className="flex-1">{name}</span>
                  <span className="text-[12px] tabular-nums text-[var(--text-dim)]">{counts[key]}</span>
                </label>
                <button
                  type="button"
                  aria-expanded={infoOpen === key}
                  aria-label={copy.about.replace("{layer}", name)}
                  onClick={() => setInfoOpen((v) => (v === key ? null : key))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--text-dim)] hover:bg-overlay/8 hover:text-[var(--text-primary)]"
                >
                  <Info aria-hidden className="h-4 w-4" />
                </button>
              </div>
              {key === "earthquake" && (
                <label className="flex min-h-11 cursor-pointer items-center gap-2.5 px-1.5 pl-9 text-[12px] text-[var(--text-muted)]">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-orange-500"
                    checked={includeSmall}
                    onChange={(e) => onIncludeSmall(e.target.checked)}
                  />
                  {copy.includeSmall}
                </label>
              )}
              {infoOpen === key && (
                <dl className="mt-1 space-y-1.5 px-1.5 pb-1 text-[12px] leading-5">
                  {(["source", "updates", "limits", "ours"] as const).map((field) => (
                    <div key={field}>
                      <dt className="font-semibold text-[var(--text-muted)]">{copy.info[field]}</dt>
                      <dd className="text-[var(--text-primary)]">{info[field]}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
