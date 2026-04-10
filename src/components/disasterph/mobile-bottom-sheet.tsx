"use client";

import type { HelpAction, Incident, OfficialAdvisory } from "@/types/incident";
import type { PrepTip } from "@/lib/prep-guidance";
import { OfficialAdvisoryPanel } from "./official-advisory-panel";
import { SituationCard } from "./situation-card";

interface MobileBottomSheetProps {
  incident: Incident;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advisories: OfficialAdvisory[];
  helpActions: HelpAction[];
  prepTips: PrepTip[];
  nearPlaceName?: string | null;
}

export function MobileBottomSheet({
  incident,
  open,
  onOpenChange,
  advisories,
  helpActions,
  prepTips,
  nearPlaceName,
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
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
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
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-overlay/20" />
        <div className="grid h-[calc(100%-1.25rem)] grid-rows-[auto_minmax(0,1fr)] gap-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-medium text-[var(--text-primary)]">
                Incident Detail
              </h2>
            </div>
            <button
              className="rounded-full border border-overlay/10 px-3 py-1 text-xs text-[var(--text-muted)]"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Close
            </button>
          </div>

          <div className="grid min-h-0 gap-3 overflow-y-auto pr-1">
            <SituationCard
              incident={incident}
              helpActions={helpActions}
              prepTips={prepTips}
              nearPlaceName={nearPlaceName}
            />
            <OfficialAdvisoryPanel advisories={advisories} />
          </div>
        </div>
      </section>
    </>
  );
}
