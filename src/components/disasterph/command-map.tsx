"use client";

import dynamic from "next/dynamic";
import {
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
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
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[rgba(6,14,22,0.95)] text-[var(--text-dim)] transition hover:border-white/20 hover:text-white"
            onClick={onToggleSidebar}
            title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            type="button"
          >
            {sidebarExpanded ? (
              <ChevronsRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronsLeft className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        <button
          className={`flex h-8 w-8 items-center justify-center rounded-lg border bg-[rgba(6,14,22,0.95)] transition hover:border-white/20 hover:text-white ${
            focusMode
              ? "border-cyan-400/30 text-cyan-300"
              : "border-white/10 text-[var(--text-dim)]"
          }`}
          onClick={onToggleFocus}
          title={focusMode ? "Exit focus mode (Esc)" : "Focus mode (F)"}
          type="button"
        >
          {focusMode ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
