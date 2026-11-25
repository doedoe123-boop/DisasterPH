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
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

/**
 * Shown when the map component itself fails to download (for example on a
 * flaky connection). The feed stays usable; "Try again" reloads the page
 * because a failed lazy chunk is not reliably retried in place.
 */
function MapInitializing() {
  const { locale } = useLocale();
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="text-center">
        <div className="loading-shimmer mx-auto h-3 w-24 rounded-full" />
        <p className="mt-3 text-xs text-[var(--text-dim)]">
          {t(locale).controls.initializingMap}
        </p>
      </div>
    </div>
  );
}

function MapLoadFailed() {
  const { locale } = useLocale();
  const copy = t(locale).map;
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-background p-4"
      role="status"
    >
      <div className="max-w-xs text-center">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {copy.unavailableTitle}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-dim)]">
          {copy.unavailableBody}
        </p>
        <button
          className="mt-3 rounded-md border border-overlay/12 px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition hover:bg-overlay/6"
          onClick={() => window.location.reload()}
          type="button"
        >
          {copy.retry}
        </button>
      </div>
    </div>
  );
}

const MapboxMap = dynamic(
  () =>
    import("./mapbox-map").catch(() => ({
      // Ignores the map props; renders the fallback instead.
      default: MapLoadFailed as unknown as (typeof import("./mapbox-map"))["default"],
    })),
  {
  ssr: false,
  loading: () => <MapInitializing />,
  },
);

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
  /** Pixels of the map covered on the left by a floating panel. */
  mapLeftInset?: number;
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
  mapLeftInset = 0,
}: CommandMapProps) {
  const { locale } = useLocale();
  const controls = t(locale).controls;

  return (
    <div className="relative h-full overflow-hidden bg-background">
      <MapboxMap
        incidents={incidents}
        communityReports={communityReports}
        selectedIncidentId={selectedIncidentId}
        hoveredIncidentId={hoveredIncidentId}
        onHoverIncident={onHoverIncident}
        onSelectIncident={onSelectIncident}
        leftInset={mapLeftInset}
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
          title={focusMode ? controls.exitFullMap : controls.openFullMap}
          aria-label={focusMode ? controls.exitFullMap : controls.openFullMap}
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
            title={sidebarExpanded ? controls.collapseSidebar : controls.expandSidebar}
            aria-label={sidebarExpanded ? controls.collapseSidebar : controls.expandSidebar}
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
          title={focusMode ? controls.exitFocusMode : controls.focusMode}
          aria-label={focusMode ? controls.exitFocusMode : controls.focusMode}
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
        <div className="absolute bottom-[calc(7.5rem+env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 md:bottom-12 md:left-auto md:right-3 md:translate-x-0 lg:hidden">
          <button
            className="flex h-9 items-center gap-1.5 rounded-xl border border-overlay/10 bg-[var(--bg-panel)] px-3 text-[13px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-card)] backdrop-blur transition hover:border-overlay/20 hover:bg-overlay/8 active:scale-[0.98]"
            onClick={onToggleLowbar}
            title={controls.showFeedTitle}
            type="button"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            <span>{controls.showFeed}</span>
          </button>
        </div>
      )}
    </div>
  );
}
