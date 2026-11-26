"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map as MapIcon,
  WifiOff,
  Activity,
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
import { SourcesLine } from "@/components/disasterph/sources-line";
import { StatusStrip } from "@/components/disasterph/status-strip";
import { MapToolbar } from "@/components/disasterph/map-toolbar";
import {
  DEFAULT_QUAKE_RANGE,
  LAYER_KEYS,
  QUAKE_RANGES,
  layerOf,
  passesQuakeFilters,
  type LayerKey,
  type QuakeRange,
} from "@/lib/quake-filters";
import { viewQuery, type ViewState } from "@/lib/view-url";
import type { BaseMapState } from "@/lib/map-fallback";
import { eventLabel, t } from "@/lib/i18n";
import { computeAllPlaceRisks } from "@/lib/risk-summary";
import type { Incident, IncidentEventType } from "@/types/incident";
import { useIncidents, type IncidentsPayload } from "@/hooks/use-incidents";
import {
  EventList,
  EventSheet,
  LIST_LIMIT,
  SortToggle,
} from "@/components/disasterph/event-list";
import { sortForList, type ListSort } from "@/lib/list-sort";
import { EventCard } from "@/components/disasterph/event-card";
import { useAlertCenter } from "@/hooks/use-alert-center";
import { useSavedPlaces } from "@/hooks/use-saved-places";
import { useSelectedArea } from "@/hooks/use-selected-area";
import { ALL_AREAS, incidentInArea, resolveArea, type SelectedArea } from "@/lib/area";
import { AreaBar } from "@/components/disasterph/area-bar";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useLocale } from "@/hooks/useLocale";
import { AppHeader } from "./header";
import { CommandMap } from "./command-map";
import { EmergencyContacts } from "./emergency-contacts";
import { CommandCenterSkeleton } from "./page-skeletons";


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

/**
 * A shared link's event, if it exists in the data. An earthquake outside the
 * default filters widens them just enough to show it, unless the link set them.
 */
function linkedEvent(view: ViewState, initial?: IncidentsPayload) {
  const incident = view.event ? initial?.data.find((i) => i.id === view.event) : undefined;
  if (!incident) return { id: "", range: view.range, includeSmall: view.includeSmall };
  let range = view.range;
  let includeSmall = view.includeSmall;
  if (incident.event_type === "earthquake" && initial) {
    const at = Date.parse(initial.meta.generated_at);
    if (range === undefined) {
      range = QUAKE_RANGES.find((r) => passesQuakeFilters(incident, r.key, true, at))?.key ?? DEFAULT_QUAKE_RANGE;
      if (QUAKE_RANGES.findIndex((r) => r.key === range) < QUAKE_RANGES.findIndex((r) => r.key === DEFAULT_QUAKE_RANGE)) {
        range = DEFAULT_QUAKE_RANGE;
      }
    }
    if (includeSmall === undefined && !passesQuakeFilters(incident, range, false, at)) includeSmall = true;
  }
  return { id: incident.id, range, includeSmall };
}

export function DisasterPHCommand({ initial, initialView = {} }: { initial?: IncidentsPayload; initialView?: ViewState }) {
  // A shared link (?view=…&range=…): read once, on the server and in the
  // browser alike, so both render the same first page.
  const [linked] = useState(() => linkedEvent(initialView, initial));
  const [activeFilter, setActiveFilter] = useState<
    IncidentEventType | "all" | "critical"
  >(initialView.tab ?? "all");
  const [selectedIncidentId, setSelectedIncidentId] = useState(linked.id);
  const [hoveredIncidentId, setHoveredIncidentId] = useState<string | null>(
    null,
  );
  const [focusMode, setFocusMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [listOpen, setListOpen] = useState(false);
  // Earthquake filters (map, list and counts) and map layers.
  const [quakeRange, setQuakeRange] = useState<QuakeRange>(linked.range ?? DEFAULT_QUAKE_RANGE);
  const [includeSmall, setIncludeSmall] = useState(linked.includeSmall ?? false);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(() =>
    initialView.layers
      ? (Object.fromEntries(LAYER_KEYS.map((k) => [k, initialView.layers!.includes(k)])) as Record<LayerKey, boolean>)
      : { earthquake: true, volcano: true, typhoon: true, other: true },
  );
  // List order: newest first (default) or highest level first.
  const [sort, setSort] = useState<ListSort>("newest");
  // The saved-places panel (opened from the area bar or the map's "My places").
  const [placesOpen, setPlacesOpen] = useState(false);
  // The map's base: OpenFreeMap, or the outline of the Philippines when it
  // cannot load (offline, or its server down). "Try again" bumps the retry.
  const [baseMap, setBaseMap] = useState<BaseMapState>("normal");
  const [baseMapRetry, setBaseMapRetry] = useState(0);
  // Bumped whenever an event is chosen from the list, so the map brings it
  // into view even if it was already selected (e.g. after zooming out).
  const [focusRequest, setFocusRequest] = useState(linked.id ? 1 : 0);
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

  // ── 10-day window, from midnight Philippine time (server and browser agree) ──
  const tenDayCutoff = useMemo(() => phtDayStart(10), []);
  const allRecentIncidents = useMemo(() => {
    return incidents.filter(
      (i) => new Date(i.updated_at).getTime() >= tenDayCutoff,
    );
  }, [incidents, tenDayCutoff]);
  // Earthquake time and magnitude filters, measured from when the data was
  // generated (the same instant on the server and in the browser).
  const shownRecent = useMemo(() => {
    const at = generatedAt ? Date.parse(generatedAt) : tenDayCutoff + 10 * 86_400_000;
    return allRecentIncidents.filter((i) => passesQuakeFilters(i, quakeRange, includeSmall, at));
  }, [allRecentIncidents, quakeRange, includeSmall, generatedAt, tenDayCutoff]);

  // ── Place-first: everything below (counters, chips, feed, map) follows
  //    the visitor's chosen area, so all views share one filter state. ──
  const [serverArea] = useState<SelectedArea>(() =>
    initialView.region ? { kind: "region", region: initialView.region } : ALL_AREAS,
  );
  const [area, setArea] = useSelectedArea(serverArea);
  const effectiveArea = useMemo(() => resolveArea(area, places), [area, places]);
  const recentIncidents = useMemo(
    () => shownRecent.filter((i) => incidentInArea(i, effectiveArea, places)),
    [shownRecent, effectiveArea, places],
  );

  // ── Filtered incidents for the main view ──
  const filteredIncidents = useMemo(() => {
    if (activeFilter === "critical") {
      return recentIncidents.filter(
        (i) => i.severity === "critical" || i.severity === "warning",
      );
    }
    return filterIncidentsByType(recentIncidents, activeFilter);
  }, [recentIncidents, activeFilter]);

  // The list, in the order the reader chose (the map does not depend on it).
  const listIncidents = useMemo(() => sortForList(filteredIncidents, sort), [filteredIncidents, sort]);

  // The event the reader chose (marker, list row, shared link): its card opens
  // as a bottom sheet on phones and a popover on wide screens. It counts only
  // while the event is in the current view (area, tab, time and magnitude
  // filters); otherwise nothing is chosen, in the page and in the URL.
  const chosen: Incident | null = selectedIncidentId
    ? filteredIncidents.find((i) => i.id === selectedIncidentId) ?? null
    : null;
  const chosenId = chosen?.id ?? "";
  // Escape closes the card.
  useEffect(() => {
    if (!chosen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIncidentId("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chosen]);

  // Shareable URL: the view's allowed settings only (view-url.ts). Never a
  // saved place, a location, or a region found from the device's location.
  const sharedRegion =
    effectiveArea.kind === "region" && !effectiveArea.fromLocation ? effectiveArea.region : null;
  useEffect(() => {
    const query = viewQuery({
      region: sharedRegion,
      tab: activeFilter,
      layers,
      range: quakeRange,
      includeSmall,
      event: chosenId || null,
    });
    const { pathname, search, hash } = window.location;
    if (query !== search) window.history.replaceState(null, "", pathname + query + hash);
  }, [sharedRegion, activeFilter, layers, quakeRange, includeSmall, chosenId]);

  // Map: the same events, minus layers switched off in the Layers panel.
  const mapIncidents = useMemo(
    () => filteredIncidents.filter((i) => layers[layerOf(i)]),
    [filteredIncidents, layers],
  );
  const layerCounts = useMemo(() => {
    const counts = Object.fromEntries(LAYER_KEYS.map((k) => [k, 0])) as Record<LayerKey, number>;
    for (const i of filteredIncidents) counts[layerOf(i)]++;
    return counts;
  }, [filteredIncidents]);

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

      {/* ── Offline, or the base map unavailable (outline map) ── */}
      <AnimatePresence initial={false}>
        {(!isOnline || baseMap !== "normal") && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            role="status"
            // Compact on phones: every line here is taken from the map's height.
            className="offline-banner flex items-center gap-2 border-b border-amber-400/25 bg-amber-400/10 px-4 py-1.5 text-[13px] leading-5 text-amber-200 overflow-hidden md:gap-2.5 md:px-5 md:py-2 md:text-sm"
          >
            {isOnline ? <MapIcon aria-hidden className="h-4 w-4 shrink-0" /> : <WifiOff aria-hidden className="h-4 w-4 shrink-0" />}
            <span className="min-w-0 flex-1" suppressHydrationWarning>
              {!isOnline &&
                (generatedAt
                  ? i18n.common.offlineSaved.replace("{time}", formatDateTime(generatedAt))
                  : i18n.common.offlineSavedNoTime)}
              {/* Offline, the outline map speaks for itself: one short line keeps
                  the phone map usable. Online, say why the map looks plain. */}
              {isOnline && baseMap !== "normal" && i18n.map.outlineUnavailable}
            </span>
            {isOnline && baseMap !== "normal" && (
              <button
                type="button"
                onClick={() => setBaseMapRetry((n) => n + 1)}
                className="-my-1 min-h-11 shrink-0 rounded-md border border-current/30 px-2.5 text-[13px] font-semibold md:min-h-8"
              >
                {i18n.map.retry}
              </button>
            )}
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

              {filteredIncidents.length > 1 && <SortToggle sort={sort} onSort={setSort} locale={locale} />}
              <div className="flex-1 overflow-y-auto scrollbar-none">
                <EventList
                  incidents={listIncidents}
                  locale={locale}
                  selectedId={chosenId || null}
                  onSelect={(incident) => {
                    setSelectedIncidentId(incident.id);
                    setFocusRequest((n) => n + 1);
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
                placesOpen={placesOpen}
                onPlacesOpen={setPlacesOpen}
              />
              <div className="px-4 pb-2.5 md:px-5">
                <SourcesLine statuses={sourceStatuses} locale={locale} offline={!isOnline} checkedAt={generatedAt} />
                <StatusStrip incidents={incidents} sources={sourceStatuses} locale={locale} />
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
              incidents={mapIncidents}
              toolbar={
                <MapToolbar
                  locale={locale}
                  range={quakeRange}
                  onRange={setQuakeRange}
                  includeSmall={includeSmall}
                  onIncludeSmall={setIncludeSmall}
                  layers={layers}
                  onLayer={(key, on) => setLayers((l) => ({ ...l, [key]: on }))}
                  counts={layerCounts}
                  hasOther={layerCounts.other > 0}
                />
              }
              communityReports={[]}
              // Only an explicit selection moves the map. The detail panels
              // fall back to the newest event, but the camera must not.
              selectedIncidentId={chosenId}
              hoveredIncidentId={hoveredIncidentId}
              onHoverIncident={setHoveredIncidentId}
              onSelectIncident={(incident) => {
                setSelectedIncidentId(incident.id);
              }}
              focusMode={focusMode}
              onToggleFocus={() => setFocusMode((f) => !f)}
              sidebarExpanded={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((s) => !s)}
              lowbarExpanded
              // Keep the collapsed list panel clear when fitting the country.
              mapBottomInset={narrow && !focusMode ? sheetPeek : 0}
              focusRequest={focusRequest}
              // Focus-mode incident card: absolute left-4 (16px) + w-[320px].
              mapLeftInset={0}
              popover={
                !narrow && chosen ? (
                  <EventCard
                    incident={chosen}
                    locale={locale}
                    sourceStatuses={sourceStatuses}
                    onClose={() => setSelectedIncidentId("")}
                    variant="popover"
                  />
                ) : null
              }
              hoverPreviews={!narrow}
              savedPlaces={places}
              showPlacePins={effectiveArea.kind === "places" || effectiveArea.kind === "place"}
              onMyPlaces={() => setArea({ kind: "places" })}
              onAddPlace={() => {
                setFocusMode(false);
                setPlacesOpen(true);
              }}
              onBaseMapChange={setBaseMap}
              baseMapRetry={baseMapRetry}
            />

            {/* ── Phones and tablets: the event list as a panel over the map ── */}
            {!focusMode && (
              <EventSheet
                chosen={chosen}
                onCloseChosen={() => setSelectedIncidentId("")}
                open={listOpen}
                onToggle={() => setListOpen((v) => !v)}
                onPeekHeight={setSheetPeek}
                incidents={listIncidents}
                sort={sort}
                onSort={setSort}
                locale={locale}
                selectedId={chosenId || null}
                onSelect={(incident) => {
                  setSelectedIncidentId(incident.id);
                  setListOpen(false); // show the map with the event
                  setFocusRequest((n) => n + 1);
                }}
                filter={activeFilter}
                sourceStatuses={sourceStatuses}
              />
            )}

          </section>

        </div>
      </div>

      {/* ── Fixed Overlay: Emergency Hotlines ── */}
      {!focusMode && <EmergencyContacts />}
    </main>
  );
}
