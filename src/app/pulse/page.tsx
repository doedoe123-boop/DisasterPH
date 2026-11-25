"use client";

import { displayRegion } from "@/lib/geo/ph-regions";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Waves,
  Wind,
  Droplets,
  Mountain,
  TriangleAlert,
  AlertTriangle,
  MapPin,
  Clock,
  Activity,
} from "lucide-react";
import { filterIncidentsByType } from "@/lib/incidents";
import { eventTimeWithAge } from "@/lib/event-time";
import { eventLabel, severityText, t } from "@/lib/i18n";
import { plainAlertInterpretation } from "@/lib/plain-alert";
import { visualFromSeverity } from "@/lib/severity";
import type {
  Incident,
  IncidentEventType,
  IncidentSeverity,
} from "@/types/incident";
import { useIncidents } from "@/hooks/use-incidents";
import { HazardEmptyState } from "@/components/disasterph/hazard-empty-state";
import { useLocale } from "@/hooks/useLocale";
import { AppHeader } from "@/components/disasterph/header";
import { PulseFeedSkeleton } from "@/components/disasterph/page-skeletons";

/* ── Icons per hazard type ── */
const HAZARD_ICON: Record<string, typeof Waves> = {
  earthquake: Waves,
  typhoon: Wind,
  flood: Droplets,
  volcano: Mountain,
  landslide: TriangleAlert,
  wildfire: AlertTriangle,
};

/* ── Type filter chips ── */
const TYPE_FILTERS: Array<{
  label: string;
  value: IncidentEventType | "all";
}> = [
  { label: "All", value: "all" },
  { label: "Earthquake", value: "earthquake" },
  { label: "Typhoon", value: "typhoon" },
  { label: "Flood", value: "flood" },
  { label: "Volcano", value: "volcano" },
  { label: "Landslide", value: "landslide" },
];

/* ── Severity filter chips ── */
const SEVERITY_FILTERS: Array<{
  label: string;
  value: IncidentSeverity | "all";
}> = [
  { label: "All", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "Warning", value: "warning" },
  { label: "Watch", value: "watch" },
  { label: "Info", value: "advisory" },
];

/* ── severity glow map ── */
const SEVERITY_GLOW: Record<string, string> = {
  critical: "card-glow-critical",
  warning: "card-glow-warning",
  watch: "card-glow-watch",
};


/** Build data pills from incident metadata */
function dataPills(incident: Incident): string[] {
  const pills: string[] = [];
  const m = incident.metadata;
  if (incident.event_type === "earthquake") {
    if (m.magnitude != null)
      pills.push(`MAG ${Number(m.magnitude).toFixed(1)}`);
    if (m.depth_km != null)
      pills.push(`${Number(m.depth_km).toFixed(0)}km deep`);
  } else if (incident.event_type === "typhoon") {
    if (m.signal_number != null) pills.push(`Signal ${m.signal_number}`);
    if (m.wind_speed_kph != null) pills.push(`${m.wind_speed_kph} kph`);
  } else if (incident.event_type === "volcano") {
    if (m.alert_level) pills.push(`Alert: ${String(m.alert_level)}`);
  }
  return pills;
}

/* ── Progressive loading ── */
/** Cards rendered at first, and added each time the reader nears the end. */
const PAGE_SIZE = 12;

/**
 * Calls onVisible when it comes within ~600px of the viewport, so the next
 * cards are ready before the reader reaches the end of the list.
 */
function LoadMoreSentinel({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onVisible);
  useEffect(() => {
    callback.current = onVisible;
  }, [onVisible]);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) callback.current();
      },
      { rootMargin: "0px 0px 600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} aria-hidden className="h-px w-full" />;
}

/* ── Motion variants ── */

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function PulseFeedPage() {
  const { incidents, isLoading, sourceStatuses } = useIncidents();
  const { locale } = useLocale();
  const i18n = t(locale);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<IncidentEventType | "all">(
    "all",
  );
  const [severityFilter, setSeverityFilter] = useState<
    IncidentSeverity | "all"
  >("all");

  const typeFilters = useMemo(
    () =>
      TYPE_FILTERS.map((filter) => ({
        ...filter,
        label:
          filter.value === "all"
            ? i18n.common.all
            : eventLabel(filter.value, locale),
      })),
    [i18n.common.all, locale],
  );

  const severityFilters = useMemo(
    () =>
      SEVERITY_FILTERS.map((filter) => ({
        ...filter,
        label:
          filter.value === "all"
            ? i18n.common.all
            : severityText(filter.value, locale),
      })),
    [i18n.common.all, locale],
  );

  const filtered = useMemo(() => {
    let result = filterIncidentsByType(incidents, typeFilter);
    if (severityFilter !== "all") {
      result = result.filter((i) => i.severity === severityFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.region.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q),
      );
    }
    return result;
  }, [incidents, typeFilter, severityFilter, search]);

  // How many cards are rendered. Resets to the first page when the filters
  // change (tracked by key, so no state update inside an effect).
  const filterKey = `${typeFilter}|${severityFilter}|${search.trim().toLowerCase()}`;
  const [paging, setPaging] = useState({ key: filterKey, count: PAGE_SIZE });
  const visibleCount = paging.key === filterKey ? paging.count : PAGE_SIZE;
  const shown = filtered.slice(0, visibleCount);
  const remaining = filtered.length - shown.length;
  const showMore = () =>
    setPaging({ key: filterKey, count: Math.min(visibleCount + PAGE_SIZE, filtered.length) });

  if (isLoading && incidents.length === 0) {
    return <PulseFeedSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <AppHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-10 pb-20 md:pb-8">
        {/* ── Page heading ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10">
              <Activity className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                {locale === "fil" ? "Mga Abiso" : "Alerts"}
              </h1>
              <p className="text-[12px] md:text-[13px] text-[var(--text-dim)] mt-0.5 hidden sm:block">
                {locale === "fil"
                  ? "Live na daloy ng mga abiso sa sakuna"
                  : "Real-time disaster event stream"}
              </p>
            </div>
          </div>
          <span className="text-[13px] md:text-[15px] font-medium text-[var(--text-muted)] shrink-0">
            {filtered.length}{" "}
            {filtered.length === 1 ? i18n.common.event : i18n.common.events}
          </span>
        </motion.div>

        {/* ── Search bar ── */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative mt-4 md:mt-6"
        >
          <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder={i18n.common.searchEvents}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-overlay/12 bg-[var(--bg-panel)] py-3 md:py-3 pl-12 pr-5 text-[14px] md:text-[15px] text-[var(--text-primary)] placeholder-[var(--text-dim)] outline-none transition focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/15 shadow-[var(--shadow-card)]"
          />
        </motion.div>

        {/* ── Filter chips ── */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="sticky top-0 z-10 mt-4 md:mt-5 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 py-3 bg-[var(--bg-base)] flex items-center gap-2 md:gap-2.5 overflow-x-auto scrollbar-none md:flex-wrap md:overflow-visible"
        >
          <Filter className="h-[18px] w-[18px] shrink-0 text-[var(--text-dim)]" />

          {/* Type filters */}
          {typeFilters.map((f) => (
            <button
              key={`type-${f.value}`}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={`shrink-0 rounded-full px-3 md:px-3.5 py-2 md:py-1.5 text-[12px] font-semibold uppercase tracking-wider transition border ${
                typeFilter === f.value
                  ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                  : "text-[var(--text-dim)] border-transparent hover:bg-overlay/6 hover:text-[var(--text-primary)]"
              }`}
            >
              {f.label}
            </button>
          ))}

          {/* Divider */}
          <div className="mx-0.5 md:mx-1 h-5 w-px shrink-0 bg-overlay/12" />

          {/* Severity filters */}
          {severityFilters.map((f) => (
            <button
              key={`sev-${f.value}`}
              type="button"
              onClick={() => setSeverityFilter(f.value)}
              className={`shrink-0 rounded-full px-3 md:px-3.5 py-2 md:py-1.5 text-[12px] font-semibold uppercase tracking-wider transition border ${
                severityFilter === f.value
                  ? f.value === "critical"
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : f.value === "warning"
                      ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
                      : "bg-orange-500/15 text-orange-400 border-orange-500/30"
                  : "text-[var(--text-dim)] border-transparent hover:bg-overlay/6 hover:text-[var(--text-primary)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* ── Event cards grid ── */}
        {filtered.length > 0 && (
          <>
            <div className="mt-6 md:mt-8 grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((incident) => (
                <EventCard key={incident.id} incident={incident} />
              ))}
            </div>
            {remaining > 0 && (
              <div className="mt-6 flex flex-col items-center gap-2">
                <LoadMoreSentinel key={visibleCount} onVisible={showMore} />
                <p className="text-[12px] text-[var(--text-dim)]" aria-live="polite">
                  {i18n.common.showingOf
                    .replace("{shown}", String(shown.length))
                    .replace("{total}", String(filtered.length))}
                </p>
                <button
                  type="button"
                  onClick={showMore}
                  className="rounded-lg border border-overlay/10 bg-[var(--bg-panel)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-overlay/[0.06]"
                >
                  {i18n.common.showMore.replace("{n}", String(Math.min(PAGE_SIZE, remaining)))}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Empty state ── */}
        {!isLoading && filtered.length === 0 && incidents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-20 text-center"
          >
            {typeFilter !== "all" && severityFilter === "all" && !search.trim() ? (
              <HazardEmptyState
                filter={typeFilter}
                locale={locale}
                sourceStatuses={sourceStatuses}
              />
            ) : (
              <p className="text-[16px] text-[var(--text-muted)]">
                {i18n.common.noEventsMatch}
              </p>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

/* ── Event Card Component ── */
function EventCard({ incident }: { incident: Incident }) {
  const { locale } = useLocale();
  const sv = visualFromSeverity(incident.severity);
  const Icon = HAZARD_ICON[incident.event_type] ?? AlertTriangle;
  const pills = dataPills(incident);
  const glowClass = SEVERITY_GLOW[incident.severity] ?? "";

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Link
        href={`/pulse/${encodeURIComponent(incident.id)}`}
        className={`group flex h-full flex-col rounded-xl border bg-[var(--bg-panel)] p-4 md:p-5 transition-all duration-200 border-l-3 ${sv.accent} ${glowClass} active:bg-overlay/[0.06] hover:bg-[var(--bg-card-hover)] hover:border-overlay/20 hover:shadow-[var(--shadow-elevated)] ${
          incident.severity === "critical"
            ? "border-red-500/25"
            : incident.severity === "warning"
              ? "border-orange-500/20"
              : "border-overlay/10"
        }`}
      >
        {/* Top row: icon + badges */}
        <div className="flex flex-1 items-start gap-3">
          <div
            className={`flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl ${
              incident.severity === "critical"
                ? "bg-red-500/15 text-red-400"
                : incident.severity === "warning"
                  ? "bg-orange-500/15 text-orange-400"
                  : incident.severity === "watch"
                    ? "bg-cyan-500/12 text-cyan-400"
                    : "bg-slate-500/12 text-slate-400"
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${sv.badge}`}
              >
                {severityText(incident.severity, locale)}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-dim)]">
                {eventLabel(incident.event_type, locale)}
              </span>
            </div>

            {/* Title */}
            <h3 className="mt-2 text-[16px] font-bold leading-snug text-[var(--text-primary)] transition group-hover:text-orange-200">
              {incident.title}
            </h3>

            <p className="mt-1.5 text-[13px] leading-5 text-[var(--text-muted)]">
              {plainAlertInterpretation(incident, locale)}
            </p>

            {/* Location + time */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {displayRegion(incident.region, locale)}
              </span>
              <span
                className="flex items-center gap-1.5"
                suppressHydrationWarning
              >
                <Clock className="h-3.5 w-3.5" />
                {eventTimeWithAge(incident, locale)}
              </span>
            </div>
          </div>
        </div>

        {/* Data pills */}
        {pills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {pills.map((pill) => (
              <span
                key={pill}
                className="rounded-md border border-overlay/12 bg-overlay/[0.05] px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--text-muted)]"
              >
                {pill}
              </span>
            ))}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
