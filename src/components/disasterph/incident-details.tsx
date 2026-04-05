import { MapPin, ChevronRight } from "lucide-react";
import { eventTypeLabel, formatShortTime } from "@/lib/incidents";
import type { Incident } from "@/types/incident";

interface IncidentDetailsProps {
  incident: Incident;
}

const severityStyle: Record<string, string> = {
  advisory: "text-cyan-200 border-cyan-300/20 bg-cyan-300/10",
  watch: "text-amber-200 border-amber-300/20 bg-amber-300/10",
  warning: "text-orange-200 border-orange-300/20 bg-orange-300/10",
  critical: "text-red-200 border-red-300/20 bg-red-300/10",
};

const severityAccent: Record<string, string> = {
  advisory: "border-l-cyan-400/40",
  watch: "border-l-amber-400/40",
  warning: "border-l-orange-400/40",
  critical: "border-l-red-400/40",
};

export function IncidentDetails({ incident }: IncidentDetailsProps) {
  return (
    <section
      className={`shrink-0 rounded-lg border border-white/10 border-l-2 bg-[var(--bg-panel-strong)] p-3 ${severityAccent[incident.severity]}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {eventTypeLabel[incident.event_type]}
        </span>
        <span
          className={`rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${severityStyle[incident.severity]}`}
        >
          {incident.severity}
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

      <details className="group mt-2.5 border-t border-white/6 pt-2">
        <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-[var(--text-muted)]">
          <ChevronRight className="h-3 w-3 transition group-open:rotate-90" />
          Details
        </summary>
        <p className="mt-2 text-[12px] leading-[1.5] text-[var(--text-muted)]">
          {incident.description}
        </p>
        {Object.keys(incident.metadata).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(incident.metadata).map(([key, value]) => (
              <span
                key={key}
                className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-1 text-[11px] text-[var(--text-muted)]"
              >
                {key}: {String(value)}
              </span>
            ))}
          </div>
        )}
      </details>
    </section>
  );
}
