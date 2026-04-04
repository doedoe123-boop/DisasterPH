"use client";

import type {
  HelpAction,
  Incident,
  OfficialAdvisory,
  WatchedPlace,
} from "@/types/incident";
import { IncidentDetails } from "./incident-details";
import { AreaRiskSummary } from "./area-risk-summary";
import { OfficialAdvisoryPanel } from "./official-advisory-panel";
import { WatchlistPanel } from "./watchlist-panel";
import { HelpActions } from "./help-actions";

interface MobileBottomSheetProps {
  incident: Incident;
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advisories: OfficialAdvisory[];
  watchedPlaces: WatchedPlace[];
  helpActions: HelpAction[];
}

export function MobileBottomSheet({
  incident,
  incidents,
  onSelectIncident,
  open,
  onOpenChange,
  advisories,
  watchedPlaces,
  helpActions,
}: MobileBottomSheetProps) {
  return (
    <>
      <button
        className="panel-surface fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-[22px] px-4 py-3 text-left lg:hidden"
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-dim)]">
            Incident Sheet
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {incident.title}
          </p>
        </div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
          {open ? "Collapse" : "Expand"}
        </span>
      </button>

      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-30 bg-[rgba(2,6,12,0.45)] transition lg:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => onOpenChange(false)}
      />

      <section
        className={`panel-surface-strong fixed inset-x-0 bottom-0 z-40 h-[78vh] rounded-t-[28px] p-3 transition duration-300 lg:hidden ${
          open ? "translate-y-0" : "translate-y-[calc(100%-84px)]"
        }`}
      >
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/20" />
        <div className="grid h-[calc(100%-1.25rem)] grid-rows-[auto_minmax(0,1fr)] gap-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-medium text-white">
                Incident Detail
              </h2>
            </div>
            <button
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--text-muted)]"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Close
            </button>
          </div>

          <div className="grid min-h-0 gap-3 overflow-y-auto pr-1">
            <IncidentDetails incident={incident} />
            <AreaRiskSummary region={incident.region} incidents={incidents} />
            <OfficialAdvisoryPanel advisories={advisories} />
            <WatchlistPanel places={watchedPlaces} onSelectPlace={() => {}} />
            <HelpActions actions={helpActions} />
          </div>
        </div>
      </section>
    </>
  );
}
