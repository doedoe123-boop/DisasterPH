"use client";

import dynamic from "next/dynamic";
import type { Incident } from "@/types/incident";

const MapboxMap = dynamic(() => import("./mapbox-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#061420]">
      <div className="text-center">
        <div className="loading-shimmer mx-auto h-3 w-24 rounded-full" />
        <p className="mt-3 text-xs text-[var(--text-dim)]">Loading map…</p>
      </div>
    </div>
  ),
});

interface CommandMapProps {
  incidents: Incident[];
  selectedIncidentId: string;
  hoveredIncidentId: string | null;
  onHoverIncident: (id: string | null) => void;
  onSelectIncident: (incident: Incident) => void;
  focusMode: boolean;
  onToggleFocus: () => void;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
}

export function CommandMap({
  incidents,
  selectedIncidentId,
  hoveredIncidentId,
  onHoverIncident,
  onSelectIncident,
  focusMode,
  onToggleFocus,
  sidebarExpanded,
  onToggleSidebar,
}: CommandMapProps) {
  // Compute effective sidebar width for map padding offset
  const sidebarWidth = focusMode ? 0 : sidebarExpanded ? 320 : 48;

  return (
    <div className="relative h-full overflow-hidden bg-[#040d16]">
      <MapboxMap
        incidents={incidents}
        selectedIncidentId={selectedIncidentId}
        hoveredIncidentId={hoveredIncidentId}
        onHoverIncident={onHoverIncident}
        onSelectIncident={onSelectIncident}
        sidebarWidth={sidebarWidth}
      />

      {/* Map controls */}
      <div className="absolute right-3 top-3 z-20 hidden flex-col gap-1.5 lg:flex">
        {!focusMode && (
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[rgba(4,11,19,0.85)] text-[var(--text-dim)] backdrop-blur transition hover:border-white/20 hover:text-white"
            onClick={onToggleSidebar}
            title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            type="button"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {sidebarExpanded ? (
                <path
                  strokeLinecap="round"
                  strokeWidth="2"
                  d="M13 17l5-5-5-5M6 17l5-5-5-5"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeWidth="2"
                  d="M11 7l-5 5 5 5M18 7l-5 5 5 5"
                />
              )}
            </svg>
          </button>
        )}
        <button
          className={`flex h-8 w-8 items-center justify-center rounded-lg border bg-[rgba(4,11,19,0.85)] backdrop-blur transition hover:border-white/20 hover:text-white ${
            focusMode
              ? "border-cyan-400/30 text-cyan-300"
              : "border-white/10 text-[var(--text-dim)]"
          }`}
          onClick={onToggleFocus}
          title={focusMode ? "Exit focus mode (Esc)" : "Focus mode (F)"}
          type="button"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {focusMode ? (
              <path
                strokeLinecap="round"
                strokeWidth="2"
                d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeWidth="2"
                d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
              />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
