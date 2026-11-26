"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
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
import { EventCard } from "@/components/disasterph/event-card";
import type { ListSort } from "@/lib/list-sort";

const HAZARD_ICON: Record<string, typeof Waves> = {
  earthquake: Waves,
  typhoon: Wind,
  flood: Droplets,
  volcano: Mountain,
  landslide: TriangleAlert,
  wildfire: AlertTriangle,
};

/** Rows rendered at first; "Show more" adds this many (the alert list page has everything). */
export const LIST_LIMIT = 30;

/**
 * Rows to render: the first `limit`, extended to include the chosen event so
 * a marker chosen on the map always has its row.
 */
function visibleCount(incidents: Incident[], limit: number, selectedId: string | null): number {
  const at = selectedId ? incidents.findIndex((i) => i.id === selectedId) : -1;
  return Math.min(incidents.length, Math.max(limit, at + 1));
}

/** Bring the chosen event's row into view inside its scrolling list. */
function useScrollToSelected(listRef: React.RefObject<HTMLUListElement | null>, selectedId: string | null, active = true) {
  useEffect(() => {
    if (!active || !selectedId) return;
    const row = listRef.current?.querySelector<HTMLElement>(`[data-event-id="${CSS.escape(selectedId)}"]`);
    if (!row) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [listRef, selectedId, active]);
}

/** Newest / Highest level. Buttons with aria-pressed; 44 px tall on touch screens. */
export function SortToggle({ sort, onSort, locale }: { sort: ListSort; onSort: (s: ListSort) => void; locale: Locale }) {
  const copy = t(locale).common.list;
  return (
    <div role="group" aria-label={copy.sortLabel} className="flex items-center gap-1.5 px-4 py-2 lg:px-5">
      <span aria-hidden className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">
        {copy.sortLabel}
      </span>
      {(["newest", "severity"] as const).map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={sort === key}
          onClick={() => onSort(key)}
          className={`min-h-11 rounded-lg border px-2.5 text-[12px] font-semibold transition lg:min-h-8 ${
            sort === key
              ? "border-orange-500/50 bg-orange-500/12 text-[var(--text-primary)]"
              : "border-overlay/10 text-[var(--text-muted)] hover:bg-overlay/6"
          }`}
        >
          {key === "newest" ? copy.newest : copy.severity}
        </button>
      ))}
    </div>
  );
}

function ShowMore({ hidden, onMore, locale }: { hidden: number; onMore: () => void; locale: Locale }) {
  if (hidden <= 0) return null;
  return (
    <button
      type="button"
      onClick={onMore}
      className="flex min-h-11 w-full items-center justify-center text-[13px] font-semibold text-[var(--text-primary)] hover:bg-overlay/4"
    >
      {t(locale).common.list.showMore.replace("{n}", String(Math.min(LIST_LIMIT, hidden)))}
    </button>
  );
}

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
      data-event-id={incident.id}
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
  const [limit, setLimit] = useState(LIST_LIMIT);
  const listRef = useRef<HTMLUListElement>(null);
  // A marker chosen on the map: scroll its row into view.
  useScrollToSelected(listRef, selectedId);
  if (incidents.length === 0) {
    return <HazardEmptyState filter={filter} locale={locale} sourceStatuses={sourceStatuses} />;
  }
  const shown = visibleCount(incidents, limit, selectedId);
  return (
    <>
      <ul ref={listRef} className="flex flex-col">
        {incidents.slice(0, shown).map((incident) => (
          <EventRow
            key={incident.id}
            incident={incident}
            locale={locale}
            selected={selectedId === incident.id}
            onSelect={onSelect}
          />
        ))}
      </ul>
      <ShowMore hidden={incidents.length - shown} onMore={() => setLimit(shown + LIST_LIMIT)} locale={locale} />
    </>
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
  chosen = null,
  onCloseChosen,
  sort,
  onSort,
  ...list
}: ListProps & {
  sort: ListSort;
  onSort: (sort: ListSort) => void;
  open: boolean;
  onToggle: () => void;
  /** Height of the panel as it sits over the map (kept clear by the camera). */
  onPeekHeight?: (px: number) => void;
  /** The chosen event: the panel shows its card instead of the list. */
  chosen?: Incident | null;
  onCloseChosen?: () => void;
}) {
  const copy = t(list.locale).common.eventSheet;
  const listId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [limit, setLimit] = useState(LIST_LIMIT);
  // Opening the list shows the chosen event's row.
  useScrollToSelected(listRef, list.selectedId, open && !chosen);
  const report = useRef(onPeekHeight);
  useEffect(() => {
    report.current = onPeekHeight;
  }, [onPeekHeight]);
  // Report the height over the map (collapsed list, or an event's card) so
  // the camera keeps that strip clear; 0 when the panel is hidden (wide
  // screens). The expanded list is a temporary overlay and isn't reported.
  useEffect(() => {
    const el = ref.current;
    if (!el || (open && !chosen)) return;
    const send = () => report.current?.(Math.round(el.getBoundingClientRect().height));
    send();
    const observer = new ResizeObserver(send);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, chosen]);

  // Swipe down on the card's handle closes it.
  const dragStart = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientY;
    // Keep receiving the pointer after it leaves the handle (mouse and pen;
    // touch does this by itself).
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (start === null || e.clientY - start < 48) return;
    onCloseChosen?.();
  };

  if (chosen) {
    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="false"
        aria-label={chosen.title}
        className="event-sheet event-sheet-card pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex max-h-[55%] flex-col rounded-t-2xl border-t border-overlay/12 bg-[var(--bg-panel)] shadow-[0_-8px_24px_rgba(0,0,0,0.25)] lg:hidden"
      >
        <div
          className="flex h-6 shrink-0 cursor-grab touch-none items-center justify-center"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          aria-hidden
        >
          <span className="h-1 w-10 rounded-full bg-overlay/20" />
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <EventCard
            incident={chosen}
            locale={list.locale}
            sourceStatuses={list.sourceStatuses}
            onClose={() => onCloseChosen?.()}
            variant="sheet"
          />
        </div>
      </div>
    );
  }
  const count = list.incidents.length;
  const heading =
    count === 0
      ? copy.none
      : (count === 1 ? copy.one : sort === "severity" ? copy.manySeverity : copy.many).replace("{n}", String(count));
  const shown = open ? visibleCount(list.incidents, limit, list.selectedId) : 1;
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
        {open && count > 1 && <SortToggle sort={sort} onSort={onSort} locale={list.locale} />}
        {count === 0 ? (
          <HazardEmptyState filter={list.filter} locale={list.locale} sourceStatuses={list.sourceStatuses} />
        ) : (
          <ul ref={listRef} className="flex flex-col">
            {list.incidents.slice(0, shown).map((incident) => (
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
        {open && (
          <ShowMore hidden={count - shown} onMore={() => setLimit(shown + LIST_LIMIT)} locale={list.locale} />
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
