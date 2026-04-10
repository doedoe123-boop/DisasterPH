"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronsLeft, WifiOff } from "lucide-react";
import {
  nearestPlaceName,
  formatShortTime,
} from "@/lib/incidents";
import { getHelpActions } from "@/lib/help-actions";
import { computeAllPlaceRisks } from "@/lib/risk-summary";
import { getPrepTips } from "@/lib/prep-guidance";
import { computeThreatHeadline } from "@/lib/threat-headline";
import type { Incident } from "@/types/incident";
import { useIncidents } from "@/hooks/use-incidents";
import { useAdvisories } from "@/hooks/use-advisories";
import { useAlertCenter } from "@/hooks/use-alert-center";
import { useSavedPlaces } from "@/hooks/use-saved-places";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { AlertCenterPanel } from "./alert-center-panel";
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
import { SourceHealth } from "./source-health";
import { StateBanner } from "./state-banner";
import { StateCard } from "./state-card";
import { SituationCard } from "./situation-card";
import { NotificationSettings } from "./notification-settings";
import { EmergencyContacts } from "./emergency-contacts";
import { CommunityReportsPanel } from "./community-reports-panel";
import { useCommunityReports } from "@/hooks/use-community-reports";

export function DisasterPHDashboard() {
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
  const {
    incidents,
    stats,
    sourceStatuses,
    isLoading,
    error,
    staleAt,
    generatedAt,
  } = useIncidents();
  const { advisories, error: advisoryError } = useAdvisories();
  const { places, addPlace, removePlace } = useSavedPlaces();
  const { isOnline } = useNetworkStatus();
  const { reports, addReport, moderate, removeReport } = useCommunityReports();

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
  const { recentEvents } = useAlertCenter(incidents, placeRisks);

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

  // ── Service worker notification click → focus incident ──
  useEffect(() => {
    function handleSWMessage(event: MessageEvent) {
      if (event.data?.type === "notification-click" && event.data.url) {
        // URL format: /?incident=<id>
        try {
          const url = new URL(event.data.url, window.location.origin);
          const incidentId = url.searchParams.get("incident");
          if (incidentId) {
            setSelectedIncidentId(incidentId);
            setSheetOpen(true);
          }
        } catch {
          /* ignore malformed URLs */
        }
      }
    }
    navigator.serviceWorker?.addEventListener("message", handleSWMessage);
    return () =>
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
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
        <div className="rounded-lg border border-overlay/10 bg-[var(--bg-panel)] p-6 text-center">
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
  const degradedSourceCount = sourceStatuses.filter(
    (source) => source.status === "degraded" || source.status === "unavailable",
  ).length;
  const delayedSourceCount = sourceStatuses.filter(
    (source) => source.status === "delayed",
  ).length;
  const hasSourceProblems = degradedSourceCount > 0 || delayedSourceCount > 0;

  return (
    <main className="h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div
        className={`flex h-full flex-col bg-[var(--bg-panel)] transition-all duration-300 ${
          focusMode ? "gap-0" : "gap-0"
        }`}
      >
        <div
          className={`transition-all duration-300 overflow-hidden ${focusMode ? "h-0 opacity-0" : "opacity-100"}`}
        >
          <div className="rounded-lg border border-overlay/8 bg-[var(--bg-panel)] overflow-hidden">
            <ThreatHeadlineBar
              threat={threat}
              onClickIncident={(id) => {
                setSelectedIncidentId(id);
                setSheetOpen(true);
              }}
            />
            <SourceStrip sources={sourceStatuses} />
            <AppHeader />
          </div>
        </div>

        {/* ── Error / offline / stale-data banners ── */}
        {!isOnline && (
          <div className="mx-2 flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            <div>
              <p className="font-medium">You are offline</p>
              <p className="mt-0.5 opacity-90" suppressHydrationWarning>
                {generatedAt
                  ? `Showing cached data from ${formatShortTime(generatedAt)}.`
                  : "Showing cached data. Live updates will resume when you reconnect."}
              </p>
            </div>
          </div>
        )}
        {error && isOnline && (
          <StateBanner
            message={error}
            title="Live data fetch failed"
            tone="danger"
          />
        )}
        {staleAt && !error && (
          <StateBanner
            message="Showing last-known incident data while live feeds recover."
            title="Cached data active"
            tone="warning"
          />
        )}
        {hasSourceProblems && !error && (
          <StateBanner
            message={
              degradedSourceCount > 0
                ? `${degradedSourceCount} source${degradedSourceCount > 1 ? "s are" : " is"} degraded or unavailable.`
                : `${delayedSourceCount} source${delayedSourceCount > 1 ? "s are" : " is"} delayed.`
            }
            title="Source health is degraded"
            tone="info"
          />
        )}

        <div className={`grid min-h-0 flex-1 gap-2 ${gridCols}`}>
          <section
            className={`relative min-h-0 overflow-hidden ${
              focusMode ? "rounded-none" : "rounded-lg border border-overlay/8"
            }`}
          >
            <CommandMap
              incidents={incidents}
              communityReports={reports}
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
                <div className="rounded-lg border border-overlay/10 bg-[var(--bg-panel)] p-4">
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

            {noData && (
              <div className="pointer-events-none absolute inset-x-4 top-4 z-20 max-w-sm">
                <StateCard
                  message={
                    hasSourceProblems
                      ? "One or more sources are delayed or degraded. Incidents may appear once feeds recover."
                      : "No incidents match the current filter. The map remains available while you switch hazards or wait for new updates."
                  }
                  title={
                    hasSourceProblems
                      ? "Sources are having issues"
                      : "No matching incidents"
                  }
                  tone={hasSourceProblems ? "warning" : "neutral"}
                />
              </div>
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

              <AlertCenterPanel
                alerts={recentEvents}
                onSelectIncident={(incidentId) => {
                  setSelectedIncidentId(incidentId);
                  setSelectedPlaceId(null);
                }}
              />

              {/* ── Situation Card (action-oriented incident details) ── */}
              {!selectedPlaceRisk && selectedIncident ? (
                <SituationCard
                  incident={selectedIncident}
                  helpActions={helpActions}
                  prepTips={prepTips}
                  nearPlaceName={selectedNearPlace}
                />
              ) : !selectedPlaceRisk && noData ? (
                <StateCard
                  message={
                    hasSourceProblems
                      ? "One or more sources are experiencing issues. Data should recover on the next refresh cycle."
                      : "Switch filters or wait for the next refresh cycle. Source status above will show if feeds are delayed."
                  }
                  title={
                    hasSourceProblems
                      ? "Waiting for sources"
                      : "No incidents match this filter"
                  }
                  tone={hasSourceProblems ? "info" : undefined}
                />
              ) : null}

              <OfficialAdvisoryPanel
                advisories={advisories}
                emptyTone={advisoryError ? "warning" : undefined}
                emptyTitle={advisoryError ? "Advisory fetch failed" : undefined}
                emptyMessage={
                  advisoryError
                    ? "Could not reach advisory sources. Cached advisories will appear when available."
                    : hasSourceProblems
                      ? "Official advisories are temporarily unavailable because one or more upstream sources are delayed or degraded."
                      : undefined
                }
              />

              <SourceHealth sourceStatuses={sourceStatuses} />

              <NotificationSettings />

              <EmergencyContacts />

              <CommunityReportsPanel
                reports={reports}
                onAddReport={addReport}
                onModerate={moderate}
                onRemove={removeReport}
              />

              {/* ── Priority Feed (always visible, collapsible) ── */}
              <div className="shrink-0">
                <button
                  className="flex w-full items-center justify-between rounded-lg border border-overlay/8 bg-[var(--bg-panel)] px-3 py-2 text-left"
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
                  <div className="mt-1 max-h-60 overflow-y-auto rounded-lg border border-overlay/8 bg-[var(--bg-panel)]">
                    <AlertFeed
                      incidents={incidents}
                      places={places}
                      selectedIncidentId={selectedIncident?.id ?? ""}
                      hoveredIncidentId={hoveredIncidentId}
                      emptyTone={hasSourceProblems ? "info" : undefined}
                      emptyMessage={
                        hasSourceProblems
                          ? "No incidents are available for this filter right now. Check source health and try again shortly."
                          : undefined
                      }
                      onHoverIncident={setHoveredIncidentId}
                      onSelectIncident={(incident) =>
                        setSelectedIncidentId(incident.id)
                      }
                    />
                  </div>
                )}
              </div>

              {/* Compact system status */}
              <div className="mt-auto flex shrink-0 items-center gap-2 rounded-lg border border-overlay/8 bg-[var(--bg-panel)] px-2.5 py-1.5 text-[10px] text-[var(--text-dim)]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    hasSourceProblems ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                />
                <span>{stats.sourcesOnline} sources</span>
                <span className="text-overlay/10">·</span>
                <span>{stats.activeAlerts} active</span>
                <span className="text-overlay/10">·</span>
                <span>{stats.regionsTracked} regions</span>
              </div>
            </aside>
          )}

          {effectiveSidebar === "collapsed" && (
            <aside className="hidden flex-col items-center gap-3 rounded-lg border border-overlay/8 bg-[var(--bg-panel)] py-2 lg:flex">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-dim)] transition hover:bg-overlay/5 hover:text-[var(--text-primary)]"
                onClick={() => setSidebarExpanded(true)}
                title="Expand sidebar"
                type="button"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>

              <div className="mx-auto h-px w-6 bg-overlay/8" />

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
