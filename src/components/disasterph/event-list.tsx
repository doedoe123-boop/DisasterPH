"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Droplets,
  Mountain,
  TriangleAlert,
  Waves,
  Wind,
} from "lucide-react";
import type { Incident, IncidentEventType, SourceStatus } from "@/types/incident";
import { severityText, t, type Locale } from "@/lib/i18n";
import { eventTimeWithAge } from "@/lib/event-time";
import { HazardEmptyState } from "@/components/disasterph/hazard-empty-state";

const HAZARD_ICON: Record<string, typeof Waves> = {
  earthquake: Waves,
  typhoon: Wind,
  flood: Droplets,
  volcano: Mountain,
  landslide: TriangleAlert,
  wildfire: AlertTriangle,
};

/** Rows rendered at most (the alert list page has everything). */
export const LIST_LIMIT = 30;

/**
 * One event: the row shows it on the map; the arrow opens its page. Plain
 * elements (no entrance animation), so server-rendered text is readable
 * before any JavaScript runs.
 */
export function EventRow({
  incident,
  locale,
  selected,
  onSelect,
}: {
  incident: Incident;
  locale: Locale;
  selected: boolean;
  onSelect: (incident: Incident) => void;
}) {
  const Icon = HAZARD_ICON[incident.event_type] ?? AlertTriangle;
  const i18n = t(locale);
  return (
    <li
      className={`flex items-stretch border-b border-overlay/5 border-l-2 ${
        selected ? "border-l-orange-400 bg-overlay/8" : "border-l-transparent hover:bg-overlay/4"
      }`}
    >
      <button
        type="button"
        aria-pressed={selected}
        className="flex min-w-0 flex-1 items-start gap-3.5 py-3.5 pl-4 pr-1 text-left lg:py-4 lg:pl-5"
        onClick={() => onSelect(incident)}
      >
        <span
          aria-hidden
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            incident.severity === "critical"
              ? "bg-red-500/15 text-red-400"
              : incident.severity === "warning"
                ? "bg-orange-500/15 text-orange-400"
                : "bg-[var(--bg-chip)] text-[var(--text-dim)]"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block break-words text-[14px] font-semibold leading-snug text-[var(--text-primary)]">
            {incident.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                incident.severity === "critical"
                  ? "text-red-400"
                  : incident.severity === "warning"
                    ? "text-orange-400"
                    : "text-[var(--text-dim)]"
              }`}
            >
              {severityText(incident.severity, locale)}
            </span>
            <span aria-hidden className="text-[var(--text-dim)] opacity-50">·</span>
            <span className="text-[12px] text-[var(--text-dim)]" suppressHydrationWarning>
              {eventTimeWithAge(incident, locale, { compact: true })}
            </span>
          </span>
        </span>
      </button>
      <Link
        href={`/pulse/${encodeURIComponent(incident.id)}`}
        aria-label={`${i18n.common.viewFullDetail}: ${incident.title}`}
        className="flex w-11 shrink-0 items-center justify-center text-[var(--text-dim)] transition hover:text-[var(--text-primary)]"
      >
        <ArrowUpRight aria-hidden className="h-4 w-4" />
      </Link>
    </li>
  );
}

interface ListProps {
  incidents: Incident[];
  locale: Locale;
  selectedId: string | null;
  onSelect: (incident: Incident) => void;
  filter: IncidentEventType | "all" | "critical";
  sourceStatuses: SourceStatus[];
}

/** The event list (wide screens: the sidebar). */
export function EventList({ incidents, locale, selectedId, onSelect, filter, sourceStatuses }: ListProps) {
  if (incidents.length === 0) {
    return <HazardEmptyState filter={filter} locale={locale} sourceStatuses={sourceStatuses} />;
  }
  return (
    <ul className="flex flex-col">
      {incidents.slice(0, LIST_LIMIT).map((incident) => (
        <EventRow
          key={incident.id}
          incident={incident}
          locale={locale}
          selected={selectedId === incident.id}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

/**
 * Phones and tablets: the same list as a panel over the bottom of the map.
 * Collapsed, it shows its heading and the newest event, so one alert is
 * always readable without scrolling; expanded, it scrolls.
 */
export function EventSheet({
  open,
  onToggle,
  onPeekHeight,
  ...list
}: ListProps & { open: boolean; onToggle: () => void; onPeekHeight?: (px: number) => void }) {
  const copy = t(list.locale).common.eventSheet;
  const listId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const report = useRef(onPeekHeight);
  useEffect(() => {
    report.current = onPeekHeight;
  }, [onPeekHeight]);
  // Report the collapsed height (titles wrap differently) so the map keeps
  // that strip clear; 0 when the panel is hidden (wide screens).
  useEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const send = () => report.current?.(Math.round(el.getBoundingClientRect().height));
    send();
    const observer = new ResizeObserver(send);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);
  const count = list.incidents.length;
  const heading =
    count === 0 ? copy.none : (count === 1 ? copy.one : copy.many).replace("{n}", String(count));
  return (
    <div
      ref={ref}
      className={`event-sheet pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl border-t border-overlay/12 bg-[var(--bg-panel)] shadow-[0_-8px_24px_rgba(0,0,0,0.25)] lg:hidden ${
        open ? "max-h-[75%]" : ""
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={onToggle}
        className="flex min-h-11 w-full shrink-0 items-center gap-2 px-4 pt-1.5 pb-1 text-left"
      >
        <span aria-hidden className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-overlay/20" />
        <span className="mt-1.5 flex-1 text-[13px] font-semibold text-[var(--text-primary)]">{heading}</span>
        <span className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-[var(--text-muted)]">
          {open ? copy.hide : copy.show}
          {open ? <ChevronDown aria-hidden className="h-4 w-4" /> : <ChevronUp aria-hidden className="h-4 w-4" />}
        </span>
      </button>
      <div id={listId} className={open ? "min-h-0 overflow-y-auto overscroll-contain" : ""}>
        {count === 0 ? (
          <HazardEmptyState filter={list.filter} locale={list.locale} sourceStatuses={list.sourceStatuses} />
        ) : (
          <ul className="flex flex-col">
            {(open ? list.incidents.slice(0, LIST_LIMIT) : list.incidents.slice(0, 1)).map((incident) => (
              <EventRow
                key={incident.id}
                incident={incident}
                locale={list.locale}
                selected={list.selectedId === incident.id}
                onSelect={list.onSelect}
              />
            ))}
          </ul>
        )}
        {open && count > LIST_LIMIT && (
          <Link
            href="/pulse"
            className="flex min-h-11 items-center justify-center text-[13px] font-semibold text-cyan-400"
          >
            {copy.all.replace("{n}", String(count))}
          </Link>
        )}
      </div>
    </div>
  );
}
