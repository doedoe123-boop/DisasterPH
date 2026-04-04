import type { Incident } from "@/types/incident";
import { IncidentFeedCard } from "./incident-feed-card";

interface AlertFeedProps {
  incidents: Incident[];
  selectedIncidentId: string;
  onSelectIncident: (incident: Incident) => void;
}

export function AlertFeed({
  incidents,
  selectedIncidentId,
  onSelectIncident,
}: AlertFeedProps) {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-white/8 bg-[var(--bg-panel)] backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          Live Feed
        </span>
        <span className="text-[11px] text-[var(--text-dim)]">
          {incidents.length} active
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-1.5">
        {incidents.length > 0 ? (
          incidents.map((incident) => (
            <IncidentFeedCard
              key={incident.id}
              incident={incident}
              selected={selectedIncidentId === incident.id}
              onClick={() => onSelectIncident(incident)}
            />
          ))
        ) : (
          <div className="p-4 text-center text-xs text-[var(--text-muted)]">
            No incidents for this filter.
          </div>
        )}
      </div>
    </section>
  );
}
