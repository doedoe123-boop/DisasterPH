"use client";

import { displayRegion } from "@/lib/geo/ph-regions";
import { useMemo, useState, useSyncExternalStore } from "react";
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
  filterIncidentsByType,
  formatDateTime,
} from "@/lib/incidents";
import { eventTimeWithAge } from "@/lib/event-time";
import { SourcesLine } from "@/components/disasterph/sources-line";
import { eventLabel, severityText, t } from "@/lib/i18n";
import { plainAlertInterpretation } from "@/lib/plain-alert";
import { computeAllPlaceRisks } from "@/lib/risk-summary";
import { visualFromSeverity } from "@/lib/severity";
import type { Incident, IncidentEventType } from "@/types/incident";
import { useIncidents, type IncidentsPayload } from "@/hooks/use-incidents";
import { EventList, EventSheet, LIST_LIMIT } from "@/components/disasterph/event-list";
import { useAlertCenter } from "@/hooks/use-alert-center";
import { useSavedPlaces } from "@/hooks/use-saved-places";
import { useSelectedArea } from "@/hooks/use-selected-area";
import { incidentInArea, resolveArea } from "@/lib/area";
import { AreaBar } from "@/components/disasterph/area-bar";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useLocale } from "@/hooks/useLocale";
import { AppHeader } from "./header";
import { CommandMap } from "./command-map";
import { EmergencyContacts } from "./emergency-contacts";
import { CommandCenterSkeleton } from "./page-skeletons";

import { getPrepTips, localizePrepTip } from "@/lib/prep-guidance";

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

/** Phones and tablets get the list as a panel over the map (below lg). */
const NARROW = "(max-width: 1023.98px)";
function subscribeNarrow(onChange: () => void) {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function useNarrowScreen(): boolean {
  return useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW).matches, () => false);
}


/** Start of the day, Philippine time, `days` ago (same on server and browser). */
function phtDayStart(days: number): number {
  const PHT = 8 * 3_600_000;
  const now = Date.now();
  return Math.floor((now + PHT) / 86_400_000) * 86_400_000 - PHT - days * 86_400_000;
}

export function DisasterPHCommand({ initial }: { initial?: IncidentsPayload }) {
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
  const [listOpen, setListOpen] = useState(false);
  // Height of the collapsed list panel (measured), kept clear when fitting the country.
  const [sheetPeek, setSheetPeek] = useState(0);
  const narrow = useNarrowScreen();

  // ── Live data hooks ──
  const { incidents, isLoading, generatedAt, sourceStatuses } = useIncidents(undefined, initial);
  const { places } = useSavedPlaces();
  const { isOnline } = useNetworkStatus();
  const { locale } = useLocale();
  const i18n = t(locale);

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

  // ── 10-day window, from midnight Philippine time (server and browser agree) ──
  const tenDayCutoff = useMemo(() => phtDayStart(10), []);
  const allRecentIncidents = useMemo(() => {
    return incidents.filter(
      (i) => new Date(i.updated_at).getTime() >= tenDayCutoff,
    );
  }, [incidents, tenDayCutoff]);

  // ── Place-first: everything below (counters, chips, feed, map) follows
  //    the visitor's chosen area, so all views share one filter state. ──
  const [area, setArea] = useSelectedArea();
  const recentIncidents = useMemo(() => {
    const effective = resolveArea(area, places);
    return allRecentIncidents.filter((i) => incidentInArea(i, effective, places));
  }, [allRecentIncidents, area, places]);

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

  // Hazards DisasterPH does not monitor yet (only NASA EONET reports them,
  // rarely): their tab appears only when there is something to show, so a
  // "0" never reads as "no floods". A zero appears only for monitored hazards.
  const nationalCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of allRecentIncidents) counts[i.event_type] = (counts[i.event_type] ?? 0) + 1;
    return counts;
  }, [allRecentIncidents]);
  const UNMONITORED = new Set(["flood", "landslide"]);

  // ── Filter bar chips ──
  const allFilterChips: FilterChip[] = [
    { label: i18n.common.recent, value: "all", icon: Activity },
    {
      // Counts and filters warning- and critical-level events.
      label: i18n.common.warningPlus,
      value: "critical",
      accentClass: "text-red-400 border-red-500/40",
    },
    { label: eventLabel("earthquake", locale), value: "earthquake", icon: Waves },
    { label: eventLabel("typhoon", locale), value: "typhoon", icon: Wind },
    { label: eventLabel("flood", locale), value: "flood", icon: Droplets },
    { label: eventLabel("volcano", locale), value: "volcano", icon: Mountain },
    { label: eventLabel("landslide", locale), value: "landslide", icon: TriangleAlert },
  ];
  const filterChips = allFilterChips.filter(
    (chip) => !UNMONITORED.has(chip.value) || (nationalCount[chip.value] ?? 0) > 0,
  );

  /** Badge text: "None active" when no typhoon exists anywhere. */
  function chipBadge(value: string): string {
    if (value === "typhoon" && (nationalCount.typhoon ?? 0) === 0) return i18n.common.noneActive;
    return String(chipCount(value));
  }

  function chipCount(value: string): number {
    // Same 10-day set the feed shows, so the numbers agree.
    if (value === "all") return recentIncidents.length;
    if (value === "critical") return criticalCount;
    return countByType[value] ?? 0;
  }

  // ── Loading screen ──
  if (isLoading && incidents.length === 0) {
    return <CommandCenterSkeleton />;
  }

  // Bottom padding = the fixed bars, so nothing sits under them: the hotline
  // bar (its measured height, --hotline-bar-h; 3rem until measured) plus,
  // below md, the phone tab bar (3.5rem).
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground pb-[calc(var(--hotline-bar-h,3rem)+3.5rem+env(safe-area-inset-bottom))] md:pb-[var(--hotline-bar-h,3rem)]">
      {/* ── Global Header ── */}
      <AppHeader />

      {/* ── Offline warning ── */}
      <AnimatePresence initial={false}>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-2.5 border-b border-amber-400/25 bg-amber-400/10 px-5 py-2 text-sm text-amber-200 overflow-hidden"
          >
            <WifiOff className="h-4 w-4 shrink-0" />
            <span suppressHydrationWarning>
              {i18n.common.offlineShowingCached}
              {generatedAt ? ` from ${formatDateTime(generatedAt)}` : ""}.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Body: Sidebar + Main ── */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row overflow-hidden">
        {/* ── Left Sidebar: the event list on wide screens ── */}
        <AnimatePresence initial={false}>
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
                  {i18n.nav.recentEvents}
                </h2>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-dim)] transition hover:bg-overlay/8 hover:text-[var(--text-primary)]"
                  onClick={() => setSidebarOpen(false)}
                  title={i18n.controls.closeSidebar}
                  aria-label={i18n.controls.closeSidebar}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Summary counters ── */}
              <div className="grid grid-cols-2 gap-px border-b border-overlay/8 bg-overlay/5">
                {[
                  {
                    label: i18n.common.recent,
                    count: recentIncidents.length,
                    color: "text-orange-400",
                  },
                  {
                    label: i18n.common.warningPlus,
                    count: criticalCount,
                    color: "text-red-400",
                  },
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
                <EventList
                  incidents={filteredIncidents}
                  locale={locale}
                  selectedId={selectedIncidentId || null}
                  onSelect={(incident) => {
                    setSelectedIncidentId(incident.id);
                    setSheetOpen(true);
                  }}
                  filter={activeFilter}
                  sourceStatuses={sourceStatuses}
                />
                {filteredIncidents.length > LIST_LIMIT && (
                  <Link
                    href="/pulse"
                    className="flex min-h-11 items-center justify-center text-[13px] font-semibold text-cyan-400"
                  >
                    {i18n.common.eventSheet.all.replace("{n}", String(filteredIncidents.length))}
                  </Link>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main Content Area ── */}
        <div
          className={`flex min-w-0 flex-1 flex-col ${focusMode ? "relative" : ""}`}
        >
          {/* ── Your area (place-first entry point) ── */}
          {!focusMode && (
            <div className="border-b border-overlay/8 bg-[var(--bg-panel)]">
              <AreaBar
                area={area}
                count={recentIncidents.length}
                locale={locale}
                onChange={setArea}
                places={places}
                recentIncidents={allRecentIncidents}
                warningCount={criticalCount}
              />
              <div className="px-4 pb-2.5 md:px-5">
                <SourcesLine statuses={sourceStatuses} locale={locale} offline={!isOnline} checkedAt={generatedAt} />
              </div>
            </div>
          )}

          {/* ── Filter Bar ── */}
          {!focusMode && (
            <motion.div
              initial={false}
              className="border-b border-overlay/10 bg-[var(--bg-panel)] px-4 md:px-5 py-2.5 md:py-3"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden md:flex items-center gap-1.5 text-[var(--text-dim)]">
                  <Activity className="h-[18px] w-[18px]" />
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 md:flex-wrap md:overflow-visible">
                  {filterChips.map((chip) => {
                    const badge = chipBadge(chip.value);
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
                          {badge}
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
                : "relative min-h-0 flex-1"
            }
          >
            <CommandMap
              incidents={filteredIncidents}
              communityReports={[]}
              // Only an explicit selection moves the map. The detail panels
              // fall back to the newest event, but the camera must not.
              selectedIncidentId={selectedIncidentId}
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
              lowbarExpanded
              // Keep the collapsed list panel clear when fitting the country.
              mapBottomInset={narrow && !focusMode ? sheetPeek : 0}
              // Focus-mode incident card: absolute left-4 (16px) + w-[320px].
              mapLeftInset={focusMode && sheetOpen && selectedIncident ? 336 : 0}
            />

            {/* ── Phones and tablets: the event list as a panel over the map ── */}
            {!focusMode && (
              <EventSheet
                open={listOpen}
                onToggle={() => setListOpen((v) => !v)}
                onPeekHeight={setSheetPeek}
                incidents={filteredIncidents}
                locale={locale}
                selectedId={selectedIncidentId || null}
                onSelect={(incident) => {
                  setSelectedIncidentId(incident.id);
                  setListOpen(false); // show the map with the event
                }}
                filter={activeFilter}
                sourceStatuses={sourceStatuses}
              />
            )}

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
                            {eventLabel(selectedIncident.event_type, locale)}
                          </span>
                          <span
                            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sv.badge}`}
                          >
                            {severityText(selectedIncident.severity, locale)}
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

                        <p className="mt-2 rounded-lg border border-cyan-400/15 bg-cyan-400/8 px-3 py-2 text-[12px] font-medium leading-5 text-[var(--text-primary)]">
                          {plainAlertInterpretation(selectedIncident, locale)}
                        </p>

                        {/* Location + time */}
                        <div className="mt-1.5 flex items-center gap-3 text-[12px] text-[var(--text-muted)]">
                          <span>{displayRegion(selectedIncident.region, locale)}</span>
                          <span className="text-[var(--text-dim)] opacity-50">
                            ·
                          </span>
                          <span suppressHydrationWarning>
                            {eventTimeWithAge(selectedIncident, locale)}
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
                              {i18n.common.whatToDo}
                            </p>
                            <div className="space-y-1">
                              {topTips.map((tip) => (
                                <p
                                  key={tip.id}
                                  className="flex items-start gap-1.5 text-[12px] leading-tight text-[var(--text-muted)]"
                                >
                                  <span className="mt-px text-cyan-400">✓</span>
                                  {localizePrepTip(tip, locale).title}
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
                          {i18n.common.viewFullDetail}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })()}
            </AnimatePresence>
          </section>

        </div>
      </div>

      {/* ── Fixed Overlay: Emergency Hotlines ── */}
      {!focusMode && <EmergencyContacts />}
    </main>
  );
}
