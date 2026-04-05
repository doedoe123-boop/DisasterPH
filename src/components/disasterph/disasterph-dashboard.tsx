"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronsLeft } from "lucide-react";
import { eventTypeLabel, nearestPlaceName } from "@/lib/incidents";
import { getHelpActions } from "@/lib/help-actions";
import { computeAllPlaceRisks } from "@/lib/risk-summary";
import { getPrepTips } from "@/lib/prep-guidance";
import { computeThreatHeadline } from "@/lib/threat-headline";
import type { Incident, IncidentEventType } from "@/types/incident";
import { useIncidents } from "@/hooks/use-incidents";
import { useAdvisories } from "@/hooks/use-advisories";
import { useSavedPlaces } from "@/hooks/use-saved-places";
import { useSourceStatus } from "@/hooks/use-source-status";
import { AppHeader } from "./header";
import { CommandMap } from "./command-map";
import { AlertFeed } from "./alert-feed";
import { OfficialAdvisoryPanel } from "./official-advisory-panel";
import { MobileBottomSheet } from "./mobile-bottom-sheet";
import { FloatingIncidentCard } from "./floating-incident-card";
import { SavedPlaces } from "./saved-places";
import { RiskSummary } from "./risk-summary";
import ThreatHeadlineBar from "./threat-headline";
import { SourceStrip } from "./source-strip";
import { SituationCard } from "./situation-card";

const filters: Array<{ label: string; value: IncidentEventType | "all" }> = [
  { label: "All", value: "all" },
  { label: eventTypeLabel.typhoon, value: "typhoon" },
  { label: eventTypeLabel.flood, value: "flood" },
  { label: eventTypeLabel.earthquake, value: "earthquake" },
  { label: eventTypeLabel.volcano, value: "volcano" },
  { label: eventTypeLabel.landslide, value: "landslide" },
];

export function BantayPHDashboard() {
  const [activeFilter, setActiveFilter] = useState<IncidentEventType | "all">(
    "all",
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [feedOpen, setFeedOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [hoveredIncidentId, setHoveredIncidentId] = useState<string | null>(
    null,
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // ── Live data hooks ──
  const { incidents, stats, isLoading, error, staleAt } =
    useIncidents(activeFilter);
  const { advisories } = useAdvisories();
  const { places, addPlace, removePlace } = useSavedPlaces();
  const { sourceStatuses } = useSourceStatus();

  const selectedIncident: Incident | undefined =
    incidents.find((i) => i.id === selectedIncidentId) ?? incidents[0];

  const helpActions = useMemo(
    () => getHelpActions(selectedIncident),
    [selectedIncident],
  );

  // ── Risk computation for saved places ──
  const placeRisks = useMemo(
    () => computeAllPlaceRisks(places, incidents),
    [places, incidents],
  );

  const selectedPlaceRisk = useMemo(
    () => placeRisks.find((r) => r.place.id === selectedPlaceId) ?? null,
    [placeRisks, selectedPlaceId],
  );

  // ── Prep tips based on selected incident ──
  const prepTips = useMemo(
    () =>
      selectedIncident
        ? getPrepTips(selectedIncident.event_type, selectedIncident.severity)
        : [],
    [selectedIncident],
  );

  // ── Threat headline ──
  const threat = useMemo(
    () => computeThreatHeadline(incidents, places, placeRisks),
    [incidents, places, placeRisks],
  );

  // ── Nearest place name for selected incident ──
  const selectedNearPlace = useMemo(
    () =>
      selectedIncident ? nearestPlaceName(selectedIncident, places) : null,
    [selectedIncident, places],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsBooting(false), 900);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      }
      if (e.key === "Escape") {
        setFocusMode(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const effectiveSidebar = focusMode
    ? "hidden"
    : sidebarExpanded
      ? "expanded"
      : "collapsed";

  const gridCols =
    effectiveSidebar === "expanded"
      ? "lg:grid-cols-[minmax(0,1fr)_320px]"
      : effectiveSidebar === "collapsed"
        ? "lg:grid-cols-[minmax(0,1fr)_48px]"
        : "";

  // ── Loading guard: show boot screen until first data arrives ──
  if (isLoading && incidents.length === 0) {
    return (
      <main className="flex h-screen items-center justify-center bg-[var(--bg-base)] text-[var(--text-primary)]">
        <div className="rounded-lg border border-white/10 bg-[var(--bg-panel)] p-6 text-center">
          <div className="loading-shimmer mx-auto h-3 w-28 rounded-full" />
          <div className="loading-shimmer mt-3 h-6 w-36 rounded-xl mx-auto" />
          <p className="mt-4 text-xs text-[var(--text-dim)]">
            Fetching live data from PAGASA, PHIVOLCS, and EONET…
          </p>
        </div>
      </main>
    );
  }

  // When incidents have loaded but none match the filter
  const noData = incidents.length === 0;

  return (
    <main className="h-screen overflow-hidden bg-[var(--bg-base)] p-2 text-[var(--text-primary)]">
      <div
        className={`mx-auto flex h-full flex-col gap-2 rounded-lg border bg-[rgba(6,14,22,0.95)] shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all duration-300 ${
          focusMode
            ? "max-w-none gap-0 rounded-none border-transparent p-0"
            : "max-w-[1600px] border-white/8 p-2"
        }`}
      >
        <div
          className={`transition-all duration-300 overflow-hidden ${focusMode ? "h-0 opacity-0" : "opacity-100"}`}
        >
          <div className="rounded-lg border border-white/8 bg-[var(--bg-panel)] overflow-hidden">
            <ThreatHeadlineBar
              threat={threat}
              onClickIncident={(id) => {
                setSelectedIncidentId(id);
                setSheetOpen(true);
              }}
            />
            <SourceStrip sources={sourceStatuses} />
            <AppHeader
              activeFilter={activeFilter}
              filters={filters}
              onFilterChange={setActiveFilter}
            />
          </div>
        </div>

        {/* ── Error / stale-data banners ── */}
        {error && (
          <div className="mx-2 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs text-red-200">
            Data fetch error: {error}
          </div>
        )}
        {staleAt && !error && (
          <div className="mx-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200">
            Showing cached data — live feeds may be delayed.
          </div>
        )}

        <div className={`grid min-h-0 flex-1 gap-2 ${gridCols}`}>
          <section
            className={`relative min-h-0 overflow-hidden ${
              focusMode ? "rounded-none" : "rounded-lg border border-white/8"
            }`}
          >
            <CommandMap
              incidents={incidents}
              selectedIncidentId={selectedIncident?.id ?? ""}
              hoveredIncidentId={hoveredIncidentId}
              onHoverIncident={setHoveredIncidentId}
              onSelectIncident={(incident) => {
                setSelectedIncidentId(incident.id);
                setSheetOpen(true);
              }}
              focusMode={focusMode}
              onToggleFocus={() => setFocusMode((prev) => !prev)}
              sidebarExpanded={sidebarExpanded}
              onToggleSidebar={() => setSidebarExpanded((prev) => !prev)}
            />

            {isBooting && (
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(3,8,14,0.7)]">
                <div className="rounded-lg border border-white/10 bg-[var(--bg-panel)] p-4">
                  <div className="loading-shimmer mx-auto h-3 w-24 rounded-full" />
                  <div className="loading-shimmer mt-3 h-6 w-32 rounded-lg" />
                </div>
              </div>
            )}

            {effectiveSidebar !== "expanded" && selectedIncident && (
              <FloatingIncidentCard
                incident={selectedIncident}
                helpActions={helpActions}
                prepTips={prepTips}
                advisories={advisories}
                nearPlaceName={selectedNearPlace}
                placeRisks={placeRisks}
                focusMode={focusMode}
              />
            )}
          </section>

          {effectiveSidebar === "expanded" && (
            <aside className="hidden min-h-0 flex-col gap-2 overflow-y-auto lg:flex">
              {/* ── Saved Places (family monitoring — primary panel) ── */}
              <SavedPlaces
                risks={placeRisks}
                selectedPlaceId={selectedPlaceId}
                onSelectPlace={(id) => {
                  setSelectedPlaceId(id === selectedPlaceId ? null : id);
                }}
                onAddPlace={addPlace}
                onRemovePlace={removePlace}
              />

              {/* ── Place Risk Summary (when a place is selected) ── */}
              {selectedPlaceRisk && (
                <RiskSummary
                  risk={selectedPlaceRisk}
                  onSelectIncident={(id) => {
                    setSelectedIncidentId(id);
                    setSelectedPlaceId(null);
                  }}
                />
              )}

              {/* ── Situation Card (action-oriented incident details) ── */}
              {!selectedPlaceRisk && selectedIncident ? (
                <SituationCard
                  incident={selectedIncident}
                  helpActions={helpActions}
                  prepTips={prepTips}
                  nearPlaceName={selectedNearPlace}
                />
              ) : !selectedPlaceRisk && noData ? (
                <div className="rounded-xl border border-white/8 bg-[var(--bg-panel)] p-4 text-center text-sm text-[var(--text-dim)]">
                  No incidents match this filter.
                </div>
              ) : null}

              <OfficialAdvisoryPanel advisories={advisories} />

              {/* ── Priority Feed (always visible, collapsible) ── */}
              <div className="shrink-0">
                <button
                  className="flex w-full items-center justify-between rounded-lg border border-white/8 bg-[var(--bg-panel)] px-3 py-2 text-left"
                  onClick={() => setFeedOpen(!feedOpen)}
                  type="button"
                >
                  <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                    Priority Feed
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--text-dim)]">
                      {incidents.length} active
                    </span>
                    <ChevronDown
                      className={`h-3 w-3 text-[var(--text-dim)] transition ${feedOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>
                {feedOpen && (
                  <div className="mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/8 bg-[var(--bg-panel)]">
                    <AlertFeed
                      incidents={incidents}
                      places={places}
                      selectedIncidentId={selectedIncident?.id ?? ""}
                      hoveredIncidentId={hoveredIncidentId}
                      onHoverIncident={setHoveredIncidentId}
                      onSelectIncident={(incident) =>
                        setSelectedIncidentId(incident.id)
                      }
                    />
                  </div>
                )}
              </div>

              {/* Compact system status */}
              <div className="mt-auto flex shrink-0 items-center gap-2 rounded-lg border border-white/8 bg-[var(--bg-panel)] px-2.5 py-1.5 text-[10px] text-[var(--text-dim)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{stats.sourcesOnline} sources</span>
                <span className="text-white/10">·</span>
                <span>{stats.activeAlerts} active</span>
                <span className="text-white/10">·</span>
                <span>{stats.regionsTracked} regions</span>
              </div>
            </aside>
          )}

          {effectiveSidebar === "collapsed" && (
            <aside className="hidden flex-col items-center gap-3 rounded-lg border border-white/8 bg-[var(--bg-panel)] py-2 lg:flex">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-dim)] transition hover:bg-white/5 hover:text-white"
                onClick={() => setSidebarExpanded(true)}
                title="Expand sidebar"
                type="button"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>

              <div className="mx-auto h-px w-6 bg-white/8" />

              <div className="flex flex-col items-center gap-2">
                {incidents.slice(0, 10).map((incident) => (
                  <button
                    key={incident.id}
                    className={`h-2.5 w-2.5 cursor-pointer rounded-full transition-all ${
                      incident.id === selectedIncident?.id
                        ? "scale-150 ring-1 ring-cyan-400/50"
                        : "opacity-60 hover:scale-125 hover:opacity-100"
                    } ${
                      incident.severity === "critical"
                        ? "bg-red-400"
                        : incident.severity === "warning"
                          ? "bg-orange-400"
                          : incident.severity === "watch"
                            ? "bg-amber-300"
                            : "bg-cyan-300"
                    }`}
                    onClick={() => setSelectedIncidentId(incident.id)}
                    onMouseEnter={() => setHoveredIncidentId(incident.id)}
                    onMouseLeave={() => setHoveredIncidentId(null)}
                    title={incident.title}
                    type="button"
                  />
                ))}
              </div>

              <span className="mt-auto text-[9px] font-medium text-[var(--text-dim)] [writing-mode:vertical-lr] rotate-180">
                {incidents.length} active
              </span>
            </aside>
          )}
        </div>
      </div>

      {selectedIncident && (
        <MobileBottomSheet
          incident={selectedIncident}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          advisories={advisories}
          helpActions={helpActions}
          prepTips={prepTips}
          nearPlaceName={selectedNearPlace}
        />
      )}
    </main>
  );
}
