"use client";

import dynamic from "next/dynamic";
import {
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { CommunityReport, Incident } from "@/types/incident";

const MapboxMap = dynamic(() => import("./mapbox-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="text-center">
        <div className="loading-shimmer mx-auto h-3 w-24 rounded-full" />
        <p className="mt-3 text-xs text-[var(--text-dim)]">
          Initializing map view…
        </p>
      </div>
    </div>
  ),
});

interface CommandMapProps {
  incidents: Incident[];
  communityReports: CommunityReport[];
  selectedIncidentId: string;
  hoveredIncidentId: string | null;
  onHoverIncident: (id: string | null) => void;
  onSelectIncident: (incident: Incident) => void;
  focusMode: boolean;
  onToggleFocus: () => void;
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  lowbarExpanded?: boolean;
  onToggleLowbar?: () => void;
}

export function CommandMap({
  incidents,
  communityReports,
  selectedIncidentId,
  hoveredIncidentId,
  onHoverIncident,
  onSelectIncident,
  focusMode,
  onToggleFocus,
  sidebarExpanded,
  onToggleSidebar,
  lowbarExpanded = true,
  onToggleLowbar = () => {},
}: CommandMapProps) {
  // Compute effective sidebar width for map padding offset
  const sidebarWidth = focusMode ? 0 : sidebarExpanded ? 320 : 48;

  return (
    <div className="relative h-full overflow-hidden bg-background">
      <MapboxMap
        incidents={incidents}
        communityReports={communityReports}
        selectedIncidentId={selectedIncidentId}
        hoveredIncidentId={hoveredIncidentId}
        onHoverIncident={onHoverIncident}
        onSelectIncident={onSelectIncident}
        sidebarWidth={sidebarWidth}
      />

      {/* Map controls */}
      <div className="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-20 flex flex-col gap-1.5 lg:hidden">
        <button
          className={`flex h-10 w-10 items-center justify-center rounded-xl border bg-[var(--bg-panel)] backdrop-blur transition active:scale-95 ${
            focusMode
              ? "border-cyan-400/30 text-cyan-300"
              : "border-overlay/10 text-[var(--text-dim)]"
          }`}
          onClick={onToggleFocus}
          title={focusMode ? "Exit full map" : "Open full map"}
          type="button"
        >
          {focusMode ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="absolute right-3 top-3 z-20 hidden flex-col gap-1.5 lg:flex">
        {!focusMode && (
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-overlay/10 bg-[var(--bg-panel)] text-[var(--text-dim)] transition hover:border-overlay/20 hover:text-[var(--text-primary)]"
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
          className={`flex h-8 w-8 items-center justify-center rounded-lg border bg-[var(--bg-panel)] transition hover:border-overlay/20 hover:text-[var(--text-primary)] ${
            focusMode
              ? "border-cyan-400/30 text-cyan-300"
              : "border-overlay/10 text-[var(--text-dim)]"
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

      {!focusMode && !lowbarExpanded && (
        <div className="absolute bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-[3.75rem] z-20 md:bottom-12 md:right-3">
          <button
            className="flex h-9 items-center gap-1.5 rounded-xl border border-overlay/10 bg-[var(--bg-panel)] px-3 text-[13px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-card)] backdrop-blur transition hover:border-overlay/20 hover:bg-overlay/8 active:scale-[0.98]"
            onClick={onToggleLowbar}
            title="Show incident feed"
            type="button"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            <span>Show feed</span>
          </button>
        </div>
      )}
    </div>
  );
}
