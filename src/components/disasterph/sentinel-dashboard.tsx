"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { useAdvisories } from "@/hooks/use-advisories";
import { useAlertCenter } from "@/hooks/use-alert-center";
import { useSavedPlaces } from "@/hooks/use-saved-places";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useCommunityReports } from "@/hooks/use-community-reports";
import { AppHeader } from "./header";
import { CommandMap } from "./command-map";
import { EmergencyContacts } from "./emergency-contacts";
import { MobileBottomSheet } from "./mobile-bottom-sheet";
import { getHelpActions } from "@/lib/help-actions";
import { getPrepTips } from "@/lib/prep-guidance";
import { nearestPlaceName } from "@/lib/incidents";

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
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export function SentinelDashboard() {
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
  const { advisories } = useAdvisories();
  const { places } = useSavedPlaces();
  const { isOnline } = useNetworkStatus();
  const { reports } = useCommunityReports();

  const placeRisks = useMemo(
    () => computeAllPlaceRisks(places, incidents),
    [places, incidents],
  );
  useAlertCenter(incidents, placeRisks);

  const selectedIncident: Incident | undefined =
    incidents.find((i) => i.id === selectedIncidentId) ?? incidents[0];

  const helpActions = useMemo(
    () => getHelpActions(selectedIncident),
    [selectedIncident],
  );
  const prepTips = useMemo(
    () =>
      selectedIncident
        ? getPrepTips(selectedIncident.event_type, selectedIncident.severity)
        : [],
    [selectedIncident],
  );
  const selectedNearPlace = useMemo(
    () =>
      selectedIncident ? nearestPlaceName(selectedIncident, places) : null,
    [selectedIncident, places],
  );

  // ── 10-day window filter ──
  const [tenDayCutoff] = useState(() => Date.now() - 10 * 24 * 60 * 60 * 1000);
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

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* ── Global Header ── */}
      <AppHeader />

      {/* ── Offline warning ── */}
      {!isOnline && (
        <div className="flex items-center gap-2 border-b border-amber-400/20 bg-amber-400/10 px-4 py-1.5 text-xs text-amber-200">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>
            Offline — showing cached data
            {generatedAt ? ` from ${formatShortTime(generatedAt)}` : ""}.
          </span>
        </div>
      )}

      {/* ── Body: Sidebar + Main ── */}
      <div className="flex min-h-0 flex-1">
        {/* ── Left Sidebar: Recent Signals ── */}
        {sidebarOpen && !focusMode && (
          <aside className="hidden w-[260px] shrink-0 flex-col border-r border-white/8 bg-[var(--bg-panel-strong)] lg:flex">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-dim)]">
                Recent Signals
              </h2>
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-dim)] transition hover:bg-white/8 hover:text-white"
                onClick={() => setSidebarOpen(false)}
                title="Close sidebar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-none">
              {recentIncidents.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-[var(--text-dim)]">
                  No active signals
                </p>
              ) : (
                <div className="flex flex-col">
                  {recentIncidents.slice(0, 30).map((incident) => {
                    const Icon =
                      HAZARD_ICON[incident.event_type] ?? AlertTriangle;
                    const isSelected = selectedIncident?.id === incident.id;

                    return (
                      <button
                        key={incident.id}
                        type="button"
                        className={`flex items-start gap-3 px-4 py-3 text-left transition border-b border-white/5 ${
                          isSelected
                            ? "bg-white/[0.06]"
                            : "hover:bg-white/[0.03]"
                        }`}
                        onClick={() => {
                          setSelectedIncidentId(incident.id);
                          setSheetOpen(true);
                        }}
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            incident.severity === "critical"
                              ? "bg-red-500/15 text-red-400"
                              : incident.severity === "warning"
                                ? "bg-orange-500/15 text-orange-400"
                                : "bg-slate-500/15 text-slate-400"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white leading-snug">
                            {incident.title}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--text-dim)]">
                            {relativeTime(incident.updated_at)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ── Main Content Area ── */}
        <div
          className={`flex min-w-0 flex-1 flex-col ${focusMode ? "relative" : ""}`}
        >
          {/* ── Filter Bar ── */}
          {!focusMode && (
            <div className="border-b border-white/8 bg-[var(--bg-panel)] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[var(--text-dim)]">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {filterChips.map((chip) => {
                    const count = chipCount(chip.value);
                    const active = activeFilter === chip.value;

                    return (
                      <button
                        key={chip.value}
                        type="button"
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition whitespace-nowrap ${
                          active
                            ? chip.value === "critical"
                              ? "border-red-500/50 bg-red-500/15 text-red-400"
                              : "border-orange-500/40 bg-orange-500/10 text-orange-400"
                            : "border-white/10 bg-white/[0.03] text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-white"
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
                          className={`ml-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold ${
                            active
                              ? chip.value === "critical"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-orange-500/15 text-orange-300"
                              : "bg-white/8 text-[var(--text-dim)]"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <section
            className={`relative min-h-0 flex-1 ${focusMode ? "absolute inset-0 z-30" : ""}`}
          >
            <CommandMap
              incidents={filteredIncidents}
              communityReports={reports}
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
          </section>

          {/* ── Detail Feed (below map) ── */}
          {!focusMode && (
            <section className="shrink-0 border-t border-white/8 bg-[var(--bg-panel)]">
              {/* Section heading */}
              <div className="flex items-center gap-3 border-b border-white/5 px-4 py-2.5">
                <div className="flex items-center gap-1 text-[var(--text-dim)]">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div className="flex min-w-0 gap-2 overflow-x-auto scrollbar-none">
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
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                          active
                            ? "bg-orange-500/15 text-orange-400"
                            : "text-[var(--text-dim)] hover:bg-white/5 hover:text-white"
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
                <span className="ml-auto text-xs text-[var(--text-dim)]">
                  {filteredIncidents.length} active
                </span>
              </div>

              {/* Incident cards */}
              <div className="max-h-[260px] overflow-y-auto">
                {filteredIncidents.length === 0 ? (
                  <p className="py-6 text-center text-sm text-[var(--text-dim)]">
                    No incidents match the current filter.
                  </p>
                ) : (
                  filteredIncidents.slice(0, 20).map((incident) => {
                    const sv = visualFromSeverity(incident.severity);
                    const Icon =
                      HAZARD_ICON[incident.event_type] ?? AlertTriangle;

                    return (
                      <Link
                        key={incident.id}
                        href={`/pulse/${encodeURIComponent(incident.id)}`}
                        className={`flex items-start gap-3 border-b border-white/5 px-4 py-3.5 transition hover:bg-white/[0.04] border-l-2 ${sv.accent}`}
                      >
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
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
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-sm border px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${sv.badge}`}
                            >
                              {severityLabel[incident.severity]}
                            </span>
                            <span className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">
                              {eventTypeLabel[incident.event_type]}
                            </span>
                          </div>
                          <p className="mt-1 text-[15px] font-semibold leading-snug text-white">
                            {incident.title}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                            <span>{incident.region}</span>
                            <span className="text-white/20">·</span>
                            <span>{relativeTime(incident.updated_at)}</span>
                          </div>
                        </div>
                        <ArrowUpRight className="mt-2 h-4 w-4 shrink-0 text-[var(--text-dim)] transition group-hover:text-white" />
                      </Link>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── Sticky Footer: Emergency Hotlines ── */}
      {!focusMode && (
        <footer className="shrink-0 border-t border-white/10 bg-slate-900">
          <EmergencyContacts />
        </footer>
      )}

      {/* ── Mobile Bottom Sheet ── */}
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
