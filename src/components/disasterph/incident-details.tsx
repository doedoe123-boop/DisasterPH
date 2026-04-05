import { MapPin } from "lucide-react";
import { eventTypeLabel, formatShortTime } from "@/lib/incidents";
import { severityLabel, visualFromSeverity } from "@/lib/severity";
import type { Incident } from "@/types/incident";

interface IncidentDetailsProps {
  incident: Incident;
}

export function IncidentDetails({ incident }: IncidentDetailsProps) {
  const severityVisual = visualFromSeverity(incident.severity);

  return (
    <section
      className={`shrink-0 rounded-lg border border-white/10 border-l-2 bg-[var(--bg-panel-strong)] p-3 ${severityVisual.accent}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {eventTypeLabel[incident.event_type]}
        </span>
        <span
          className={`rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${severityVisual.badge}`}
        >
          {severityLabel[incident.severity]}
        </span>
        <span className="ml-auto text-[10px] text-[var(--text-dim)]">
          {incident.source}
        </span>
      </div>

      <h3 className="mt-2 text-[15px] font-semibold leading-6 text-white">
        {incident.title}
      </h3>

      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
        <MapPin className="h-3 w-3 shrink-0 text-[var(--text-dim)]" />
        <span>{incident.region}</span>
        <span className="text-[var(--text-dim)]">·</span>
        <span>{formatShortTime(incident.updated_at)}</span>
      </div>

      <div className="mt-2.5 border-t border-white/6 pt-3">
        <p className="text-[12px] leading-[1.6] text-[var(--text-muted)]">
          {incident.description}
        </p>
        {Object.keys(incident.metadata).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(incident.metadata).map(([key, value]) => (
              <span
                key={key}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                  incident.severity === "critical"
                    ? "border-red-500/30 bg-red-500/20 text-red-200"
                    : "border-white/8 bg-white/[0.03] text-[var(--text-muted)]"
                }`}
              >
                {key}: {String(value)}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
