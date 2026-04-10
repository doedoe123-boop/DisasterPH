"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  WifiOff,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  X,
  Waves,
  Wind,
  Droplets,
  Mountain,
  TriangleAlert,
} from "lucide-react";
import {
  eventTypeLabel,
  filterIncidentsByType,
  formatShortTime,
} from "@/lib/incidents";
import { computeAllPlaceRisks } from "@/lib/risk-summary";
import { severityLabel, visualFromSeverity } from "@/lib/severity";
import type { Incident, IncidentEventType } from "@/types/incident";
import { useIncidents } from "@/hooks/use-incidents";
import { useAlertCenter } from "@/hooks/use-alert-center";
import { useSavedPlaces } from "@/hooks/use-saved-places";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { AppHeader } from "./header";
import { CommandMap } from "./command-map";
import { EmergencyContacts } from "./emergency-contacts";

import { getPrepTips } from "@/lib/prep-guidance";

/* ── Hazard type icons ── */
const HAZARD_ICON: Record<string, typeof Waves> = {
  earthquake: Waves,
  typhoon: Wind,
  flood: Droplets,
  volcano: Mountain,
  landslide: TriangleAlert,
  wildfire: AlertTriangle,
};

/* ── Filter bar button config ── */
interface FilterChip {
  label: string;
  value: IncidentEventType | "all" | "critical";
  icon?: typeof Activity;
  accentClass?: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── Motion variants ── */
const fadeSlideUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};

export function DisasterPHCommand() {
  const [activeFilter, setActiveFilter] = useState<
    IncidentEventType | "all" | "critical"
  >("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [hoveredIncidentId, setHoveredIncidentId] = useState<string | null>(
    null,
  );
  const [focusMode, setFocusMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Live data hooks ──
  const { incidents, stats, isLoading, generatedAt } = useIncidents();
  const { places } = useSavedPlaces();
  const { isOnline } = useNetworkStatus();

  const placeRisks = useMemo(
    () => computeAllPlaceRisks(places, incidents),
    [places, incidents],
  );
  useAlertCenter(incidents, placeRisks);

  const selectedIncident: Incident | undefined =
    incidents.find((i) => i.id === selectedIncidentId) ?? incidents[0];

  const prepTips = useMemo(
    () =>
      selectedIncident
        ? getPrepTips(selectedIncident.event_type, selectedIncident.severity)
        : [],
    [selectedIncident],
  );

  // ── 10-day window filter (rounded to midnight for SSR/hydration stability) ──
  const tenDayCutoff = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime() - 10 * 24 * 60 * 60 * 1000;
  }, []);
  const recentIncidents = useMemo(() => {
    return incidents.filter(
      (i) => new Date(i.updated_at).getTime() >= tenDayCutoff,
    );
  }, [incidents, tenDayCutoff]);

  // ── Filtered incidents for the main view ──
  const filteredIncidents = useMemo(() => {
    if (activeFilter === "critical") {
      return recentIncidents.filter(
        (i) => i.severity === "critical" || i.severity === "warning",
      );
    }
    return filterIncidentsByType(recentIncidents, activeFilter);
  }, [recentIncidents, activeFilter]);

  // ── Count by type ──
  const countByType = useMemo(() => {
    const counts: Record<string, number> = {
      earthquake: 0,
      typhoon: 0,
      flood: 0,
      volcano: 0,
      landslide: 0,
    };
    for (const i of recentIncidents) {
      if (counts[i.event_type] !== undefined) counts[i.event_type]++;
    }
    return counts;
  }, [recentIncidents]);

  const criticalCount = useMemo(
    () =>
      recentIncidents.filter(
        (i) => i.severity === "critical" || i.severity === "warning",
      ).length,
    [recentIncidents],
  );

  // ── Filter bar chips ──
  const filterChips: FilterChip[] = [
    { label: "Active", value: "all", icon: Activity },
    {
      label: "Critical",
      value: "critical",
      accentClass: "text-red-400 border-red-500/40",
    },
    { label: "Earthquake", value: "earthquake", icon: Waves },
    { label: "Typhoon", value: "typhoon", icon: Wind },
    { label: "Flood", value: "flood", icon: Droplets },
    { label: "Volcano", value: "volcano", icon: Mountain },
    { label: "Landslide", value: "landslide", icon: TriangleAlert },
  ];

  function chipCount(value: string): number {
    if (value === "all") return stats.activeAlerts;
    if (value === "critical") return criticalCount;
    return countByType[value] ?? 0;
  }

  // ── Loading screen ──
  if (isLoading && incidents.length === 0) {
    return (
      <main className="flex h-screen items-center justify-center bg-background text-foreground">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-xl border border-overlay/10 bg-[var(--bg-panel)] p-8 text-center shadow-[var(--shadow-elevated)]"
        >
          <div className="loading-shimmer mx-auto h-3 w-32 rounded-full" />
          <div className="loading-shimmer mt-4 h-7 w-44 rounded-xl mx-auto" />
          <p className="mt-5 text-sm text-[var(--text-dim)]">
            Fetching live data from PAGASA, PHIVOLCS, and EONET…
          </p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground pb-[env(safe-area-inset-bottom)] md:pb-0">
      {/* ── Global Header ── */}
      <AppHeader />

      {/* ── Offline warning ── */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-2.5 border-b border-amber-400/25 bg-amber-400/10 px-5 py-2 text-sm text-amber-200 overflow-hidden"
          >
            <WifiOff className="h-4 w-4 shrink-0" />
            <span suppressHydrationWarning>
              Offline — showing cached data
              {generatedAt ? ` from ${formatShortTime(generatedAt)}` : ""}.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Body: Sidebar + Main ── */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row overflow-hidden">
        {/* ── Left Sidebar: Recent Signals ── */}
        <AnimatePresence>
          {sidebarOpen && !focusMode && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="hidden shrink-0 flex-col border-r border-overlay/10 bg-[var(--bg-panel-strong)] lg:flex overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-overlay/8">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  Recent Signals
                </h2>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-dim)] transition hover:bg-overlay/8 hover:text-[var(--text-primary)]"
                  onClick={() => setSidebarOpen(false)}
                  title="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Summary counters ── */}
              <div className="grid grid-cols-3 gap-px border-b border-overlay/8 bg-overlay/5">
                {[
                  {
                    label: "Active",
                    count: stats.activeAlerts,
                    color: "text-orange-400",
                  },
                  {
                    label: "Critical",
                    count: criticalCount,
                    color: "text-red-400",
                  },
                  { label: "Sources", count: 3, color: "text-cyan-400" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-[var(--bg-panel-strong)] px-3 py-3 text-center"
                  >
                    <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-dim)]">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-none">
                {recentIncidents.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-[var(--text-dim)]">
                    No active signals
                  </p>
                ) : (
                  <motion.div
                    className="flex flex-col"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {recentIncidents.slice(0, 30).map((incident) => {
                      const Icon =
                        HAZARD_ICON[incident.event_type] ?? AlertTriangle;
                      const isSelected = selectedIncident?.id === incident.id;

                      return (
                        <motion.button
                          key={incident.id}
                          type="button"
                          variants={fadeSlideUp}
                          transition={{ duration: 0.2 }}
                          className={`flex items-start gap-3.5 px-5 py-4 text-left transition-all border-b border-overlay/5 ${
                            isSelected
                              ? "bg-overlay/8 border-l-2 border-l-orange-400"
                              : "hover:bg-overlay/4 border-l-2 border-l-transparent"
                          }`}
                          onClick={() => {
                            setSelectedIncidentId(incident.id);
                            setSheetOpen(true);
                          }}
                        >
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              incident.severity === "critical"
                                ? "bg-red-500/15 text-red-400 shadow-[0_0_8px_rgba(255,93,93,0.1)]"
                                : incident.severity === "warning"
                                  ? "bg-orange-500/15 text-orange-400"
                                  : "bg-[var(--bg-chip)] text-[var(--text-dim)]"
                            }`}
                          >
                            <Icon className="h-[18px] w-[18px]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold text-[var(--text-primary)] leading-snug">
                              {incident.title}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={`text-[11px] font-bold uppercase tracking-wider ${
                                  incident.severity === "critical"
                                    ? "text-red-400"
                                    : incident.severity === "warning"
                                      ? "text-orange-400"
                                      : "text-[var(--text-dim)]"
                                }`}
                              >
                                {severityLabel[incident.severity]}
                              </span>
                              <span className="text-[var(--text-dim)] opacity-50">
                                ·
                              </span>
                              <span
                                className="text-[12px] text-[var(--text-dim)]"
                                suppressHydrationWarning
                              >
                                {relativeTime(incident.updated_at)}
                              </span>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main Content Area ── */}
        <div
          className={`flex min-w-0 flex-1 flex-col ${focusMode ? "relative" : ""}`}
        >
          {/* ── Filter Bar ── */}
          {!focusMode && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="border-b border-overlay/10 bg-[var(--bg-panel)] px-4 md:px-5 py-2.5 md:py-3"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden md:flex items-center gap-1.5 text-[var(--text-dim)]">
                  <Activity className="h-[18px] w-[18px]" />
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 md:flex-wrap md:overflow-visible">
                  {filterChips.map((chip) => {
                    const count = chipCount(chip.value);
                    const active = activeFilter === chip.value;

                    return (
                      <motion.button
                        key={chip.value}
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`flex items-center justify-center gap-1.5 md:gap-2 rounded-lg border px-3 md:px-4 py-2 md:py-2.5 text-[12px] md:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                          active
                            ? chip.value === "critical"
                              ? "border-red-500/50 bg-red-500/15 text-red-400 shadow-[0_0_12px_rgba(255,93,93,0.1)]"
                              : "border-orange-500/40 bg-orange-500/12 text-orange-400 shadow-[0_0_12px_rgba(255,140,66,0.08)]"
                            : "border-overlay/10 bg-overlay/4 text-[var(--text-muted)] hover:bg-overlay/8 hover:text-[var(--text-primary)] hover:border-overlay/15"
                        }`}
                        onClick={() =>
                          setActiveFilter(
                            chip.value as
                              | IncidentEventType
                              | "all"
                              | "critical",
                          )
                        }
                      >
                        {chip.icon && <chip.icon className="h-4 w-4" />}
                        <span>{chip.label}</span>
                        <span
                          className={`ml-0.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            active
                              ? chip.value === "critical"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-orange-500/15 text-orange-300"
                              : "bg-overlay/8 text-[var(--text-dim)]"
                          }`}
                        >
                          {count}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Map section ── */}
          <section
            className={
              focusMode
                ? "fixed inset-0 z-[1200] h-[100dvh] w-screen bg-background"
                : "relative h-[45vh] shrink-0 md:h-auto md:min-h-0 md:flex-1"
            }
          >
            <CommandMap
              incidents={filteredIncidents}
              communityReports={[]}
              selectedIncidentId={selectedIncident?.id ?? ""}
              hoveredIncidentId={hoveredIncidentId}
              onHoverIncident={setHoveredIncidentId}
              onSelectIncident={(incident) => {
                setSelectedIncidentId(incident.id);
                setSheetOpen(true);
              }}
              focusMode={focusMode}
              onToggleFocus={() => setFocusMode((f) => !f)}
              sidebarExpanded={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((s) => !s)}
            />

            {/* ── Focus Mode: Compact Incident Card ── */}
            <AnimatePresence>
              {focusMode &&
                sheetOpen &&
                selectedIncident &&
                (() => {
                  const sv = visualFromSeverity(selectedIncident.severity);
                  const FocusIcon =
                    HAZARD_ICON[selectedIncident.event_type] ?? AlertTriangle;
                  const topTips = prepTips.slice(0, 3);
                  const meta = selectedIncident.metadata;
                  const pills: string[] = [];
                  if (selectedIncident.event_type === "earthquake") {
                    if (meta.magnitude != null)
                      pills.push(`M${Number(meta.magnitude).toFixed(1)}`);
                    if (meta.depth_km != null)
                      pills.push(`${Number(meta.depth_km).toFixed(0)}km deep`);
                    if (
                      meta.felt_reports != null &&
                      Number(meta.felt_reports) > 0
                    )
                      pills.push(`${meta.felt_reports} felt`);
                  } else if (selectedIncident.event_type === "typhoon") {
                    if (meta.signal_number != null)
                      pills.push(`Signal ${meta.signal_number}`);
                    if (meta.wind_speed_kph != null)
                      pills.push(`${meta.wind_speed_kph} kph`);
                  } else if (selectedIncident.event_type === "volcano") {
                    if (meta.alert_level)
                      pills.push(`Alert ${String(meta.alert_level)}`);
                  }

                  return (
                    <motion.div
                      key={selectedIncident.id}
                      initial={{ x: -20, opacity: 0, scale: 0.96 }}
                      animate={{ x: 0, opacity: 1, scale: 1 }}
                      exit={{ x: -20, opacity: 0, scale: 0.96 }}
                      transition={{
                        duration: 0.25,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                      className="absolute left-4 top-4 z-40 hidden w-[320px] overflow-hidden rounded-xl border border-overlay/10 bg-[var(--bg-panel)] backdrop-blur-xl shadow-[var(--shadow-elevated)] lg:block"
                    >
                      {/* Severity accent bar */}
                      <div
                        className={`h-[3px] w-full ${
                          selectedIncident.severity === "critical"
                            ? "bg-red-500"
                            : selectedIncident.severity === "warning"
                              ? "bg-orange-500"
                              : selectedIncident.severity === "watch"
                                ? "bg-amber-500"
                                : "bg-cyan-500"
                        }`}
                      />

                      <div className="px-4 pt-3 pb-4">
                        {/* Top row: type + severity + close */}
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                              selectedIncident.severity === "critical"
                                ? "bg-red-500/15 text-red-400"
                                : selectedIncident.severity === "warning"
                                  ? "bg-orange-500/15 text-orange-400"
                                  : "bg-[var(--bg-chip)] text-[var(--text-dim)]"
                            }`}
                          >
                            <FocusIcon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-dim)]">
                            {eventTypeLabel[selectedIncident.event_type]}
                          </span>
                          <span
                            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sv.badge}`}
                          >
                            {severityLabel[selectedIncident.severity]}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSheetOpen(false)}
                            className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-dim)] transition hover:bg-overlay/8 hover:text-[var(--text-primary)]"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Title */}
                        <h3 className="mt-2.5 text-[15px] font-bold leading-snug text-[var(--text-primary)]">
                          {selectedIncident.title}
                        </h3>

                        {/* Location + time */}
                        <div className="mt-1.5 flex items-center gap-3 text-[12px] text-[var(--text-muted)]">
                          <span>{selectedIncident.region}</span>
                          <span className="text-[var(--text-dim)] opacity-50">
                            ·
                          </span>
                          <span suppressHydrationWarning>
                            {relativeTime(selectedIncident.updated_at)}
                          </span>
                        </div>

                        {/* Data pills */}
                        {pills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {pills.map((pill) => (
                              <span
                                key={pill}
                                className="rounded-md border border-overlay/12 bg-overlay/[0.05] px-2 py-0.5 font-mono text-[11px] font-medium text-[var(--text-muted)]"
                              >
                                {pill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* What to do (compact) */}
                        {topTips.length > 0 && (
                          <div className="mt-3 border-t border-overlay/6 pt-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-dim)] mb-1.5">
                              What to do
                            </p>
                            <div className="space-y-1">
                              {topTips.map((tip) => (
                                <p
                                  key={tip.id}
                                  className="flex items-start gap-1.5 text-[12px] leading-tight text-[var(--text-muted)]"
                                >
                                  <span className="mt-px text-cyan-400">✓</span>
                                  {tip.title}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* View full detail link */}
                        <Link
                          href={`/pulse/${encodeURIComponent(selectedIncident.id)}`}
                          className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-overlay/10 bg-overlay/[0.04] px-3 py-2 text-[12px] font-semibold text-[var(--text-primary)] transition hover:bg-overlay/8 hover:border-overlay/15"
                        >
                          View full detail
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })()}
            </AnimatePresence>
          </section>

          {/* ── Detail Feed (below map) ── */}
          {!focusMode && (
            <section className="flex-1 md:flex-none md:shrink-0 border-t border-overlay/10 bg-[var(--bg-panel)] overflow-y-auto">
              {/* Section heading */}
              <div className="sticky top-0 z-10 flex items-center gap-2 md:gap-3 border-b border-overlay/8 px-4 md:px-5 py-2.5 md:py-3 bg-[var(--bg-panel)]">
                <div className="flex items-center gap-1.5 text-[var(--text-dim)]">
                  <Activity className="h-4 w-4" />
                  <span className="text-[12px] font-bold uppercase tracking-[0.15em]">
                    Feed
                  </span>
                </div>
                <div className="flex min-w-0 gap-2 overflow-x-auto scrollbar-none ml-2">
                  {[
                    "all",
                    "earthquake",
                    "typhoon",
                    "flood",
                    "volcano",
                    "landslide",
                  ].map((t) => {
                    const active = activeFilter === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-wider transition ${
                          active
                            ? "bg-orange-500/15 text-orange-400"
                            : "text-[var(--text-dim)] hover:bg-overlay/6 hover:text-[var(--text-primary)]"
                        }`}
                        onClick={() =>
                          setActiveFilter(t as IncidentEventType | "all")
                        }
                      >
                        {t === "all"
                          ? "All"
                          : eventTypeLabel[t as IncidentEventType]}
                      </button>
                    );
                  })}
                </div>
                <span className="ml-auto text-[13px] font-medium text-[var(--text-dim)]">
                  {filteredIncidents.length} active
                </span>
              </div>

              {/* Incident cards */}
              <div className="md:max-h-72 md:overflow-y-auto pb-16 md:pb-0">
                {filteredIncidents.length === 0 ? (
                  <p className="py-8 text-center text-[15px] text-[var(--text-dim)]">
                    No incidents match the current filter.
                  </p>
                ) : (
                  <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    {filteredIncidents.slice(0, 20).map((incident) => {
                      const sv = visualFromSeverity(incident.severity);
                      const Icon =
                        HAZARD_ICON[incident.event_type] ?? AlertTriangle;

                      return (
                        <motion.div
                          key={incident.id}
                          variants={fadeSlideUp}
                          transition={{ duration: 0.2 }}
                        >
                          <Link
                            href={`/pulse/${encodeURIComponent(incident.id)}`}
                            className={`group flex items-start gap-3 md:gap-4 border-b border-overlay/5 px-4 md:px-5 py-3.5 md:py-4 transition-all active:bg-overlay/[0.06] hover:bg-overlay/[0.04] border-l-3 ${sv.accent} ${
                              incident.severity === "critical"
                                ? "card-glow-critical"
                                : ""
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                incident.severity === "critical"
                                  ? "bg-red-500/15 text-red-400"
                                  : incident.severity === "warning"
                                    ? "bg-orange-500/15 text-orange-400"
                                    : "bg-amber-500/10 text-amber-400"
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${sv.badge}`}
                                >
                                  {severityLabel[incident.severity]}
                                </span>
                                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-dim)]">
                                  {eventTypeLabel[incident.event_type]}
                                </span>
                              </div>
                              <p className="mt-1.5 text-[16px] font-semibold leading-snug text-[var(--text-primary)] group-hover:text-orange-500 transition-colors">
                                {incident.title}
                              </p>
                              <div className="mt-1.5 flex items-center gap-3 text-[13px] text-[var(--text-muted)]">
                                <span>{incident.region}</span>
                                <span className="text-[var(--text-dim)] opacity-50">
                                  ·
                                </span>
                                <span suppressHydrationWarning>
                                  {relativeTime(incident.updated_at)}
                                </span>
                              </div>
                            </div>
                            <ArrowUpRight className="mt-3 h-5 w-5 shrink-0 text-[var(--text-dim)] transition group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── Fixed Overlay: Emergency Hotlines ── */}
      {!focusMode && <EmergencyContacts />}
    </main>
  );
}
