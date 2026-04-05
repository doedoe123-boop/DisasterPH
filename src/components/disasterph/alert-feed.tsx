import type { Incident, SavedPlace } from "@/types/incident";
import { nearestPlaceName, sortByPriority } from "@/lib/incidents";
import { useMemo } from "react";
import { IncidentFeedCard } from "./incident-feed-card";
import { StateCard } from "./state-card";

interface AlertFeedProps {
  incidents: Incident[];
  places: SavedPlace[];
  selectedIncidentId: string;
  hoveredIncidentId: string | null;
  onHoverIncident: (id: string | null) => void;
  onSelectIncident: (incident: Incident) => void;
  maxVisible?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyTone?: "neutral" | "warning" | "danger" | "info";
}

export function AlertFeed({
  incidents,
  places,
  selectedIncidentId,
  hoveredIncidentId,
  onHoverIncident,
  onSelectIncident,
  maxVisible = 20,
  emptyTitle = "No incidents for this filter",
  emptyMessage = "Try another hazard filter or check source freshness.",
  emptyTone,
}: AlertFeedProps) {
  const ranked = useMemo(
    () => sortByPriority(incidents, places),
    [incidents, places],
  );
  const visible = ranked.slice(0, maxVisible);
  const hiddenCount = ranked.length - visible.length;

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-white/8 bg-[var(--bg-panel)]">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          Priority Feed
        </span>
        <span className="text-[11px] text-[var(--text-dim)]">
          {incidents.length} active
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-1.5">
        {visible.length > 0 ? (
          <>
            {visible.map((incident) => (
              <IncidentFeedCard
                key={incident.id}
                incident={incident}
                selected={selectedIncidentId === incident.id}
                hovered={hoveredIncidentId === incident.id}
                nearPlaceName={nearestPlaceName(incident, places)}
                onClick={() => onSelectIncident(incident)}
                onMouseEnter={() => onHoverIncident(incident.id)}
                onMouseLeave={() => onHoverIncident(null)}
              />
            ))}
            {hiddenCount > 0 && (
              <div className="px-2 py-2 text-center text-[11px] text-[var(--text-dim)]">
                +{hiddenCount} lower-priority events
              </div>
            )}
          </>
        ) : (
          <StateCard
            compact
            message={emptyMessage}
            title={emptyTitle}
            tone={emptyTone}
          />
        )}
      </div>
    </section>
  );
}
