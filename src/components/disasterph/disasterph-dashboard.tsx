"use client";

import { useEffect, useMemo, useState } from "react";
import { mockIncidents, mockSourceStatuses } from "@/data/mock-incidents";
import {
  buildDashboardStats,
  eventTypeLabel,
  filterIncidentsByType,
} from "@/lib/incidents";
import type { Incident, IncidentEventType } from "@/types/incident";
import { AppHeader } from "./header";
import { CommandMap } from "./command-map";
import { AlertFeed } from "./alert-feed";
import { IncidentDetails } from "./incident-details";
import { QuickStats } from "./quick-stats";
import { SourceHealth } from "./source-health";
import { MobileBottomSheet } from "./mobile-bottom-sheet";

const filters: Array<{ label: string; value: IncidentEventType | "all" }> = [
  { label: "All", value: "all" },
  { label: eventTypeLabel.typhoon, value: "typhoon" },
  { label: eventTypeLabel.flood, value: "flood" },
  { label: eventTypeLabel.earthquake, value: "earthquake" },
  { label: eventTypeLabel.volcano, value: "volcano" },
  { label: eventTypeLabel.landslide, value: "landslide" },
];

export function DisasterPHDashboard() {
  const [activeFilter, setActiveFilter] = useState<IncidentEventType | "all">(
    "all",
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [selectedIncidentId, setSelectedIncidentId] = useState(
    mockIncidents[0]?.id ?? "",
  );
  const [systemOpen, setSystemOpen] = useState(false);

  const incidents = useMemo(
    () => filterIncidentsByType(mockIncidents, activeFilter),
    [activeFilter],
  );

  const selectedIncident: Incident =
    incidents.find((incident) => incident.id === selectedIncidentId) ??
    incidents[0] ??
    mockIncidents[0];

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsBooting(false), 900);

    return () => window.clearTimeout(timeout);
  }, []);

  const stats = useMemo(() => buildDashboardStats(incidents), [incidents]);

  return (
    <main className="h-screen overflow-hidden bg-[var(--bg-base)] p-2 text-[var(--text-primary)]">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-2 rounded-2xl border border-white/8 bg-[rgba(4,11,19,0.82)] p-2 shadow-[0_28px_80px_rgba(0,0,0,0.4)]">
        <AppHeader
          activeFilter={activeFilter}
          filters={filters}
          onFilterChange={setActiveFilter}
        />

        <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="relative min-h-0 overflow-hidden rounded-2xl border border-white/8">
            <CommandMap
              incidents={incidents}
              selectedIncidentId={selectedIncident.id}
              onSelectIncident={(incident) => {
                setSelectedIncidentId(incident.id);
                setSheetOpen(true);
              }}
            />

            {isBooting && (
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(3,8,14,0.5)]">
                <div className="rounded-2xl border border-white/10 bg-[var(--bg-panel)] p-4 backdrop-blur">
                  <div className="loading-shimmer mx-auto h-3 w-24 rounded-full" />
                  <div className="loading-shimmer mt-3 h-6 w-32 rounded-xl" />
                </div>
              </div>
            )}
          </section>

          <aside className="hidden min-h-0 flex-col gap-2 lg:flex">
            <IncidentDetails incident={selectedIncident} />

            <div className="min-h-0 flex-1">
              <AlertFeed
                incidents={incidents}
                selectedIncidentId={selectedIncident.id}
                onSelectIncident={(incident) =>
                  setSelectedIncidentId(incident.id)
                }
              />
            </div>

            <div className="shrink-0">
              <button
                className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-[var(--bg-panel)] px-3 py-2 text-left backdrop-blur"
                onClick={() => setSystemOpen(!systemOpen)}
                type="button"
              >
                <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                  System
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--text-dim)]">
                    {stats.sourcesOnline} sources · {stats.activeAlerts} active
                  </span>
                  <svg
                    className={`h-3 w-3 text-[var(--text-dim)] transition ${systemOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
              {systemOpen && (
                <div className="mt-1 space-y-1">
                  <QuickStats stats={stats} />
                  <SourceHealth sourceStatuses={mockSourceStatuses} />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <MobileBottomSheet
        incident={selectedIncident}
        incidents={incidents}
        onSelectIncident={(incident) => setSelectedIncidentId(incident.id)}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        sourceStatuses={mockSourceStatuses}
        stats={stats}
      />
    </main>
  );
}
