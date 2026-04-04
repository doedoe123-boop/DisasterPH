import { eventTypeLabel, formatShortTime } from "@/lib/incidents";
import type { Incident } from "@/types/incident";

interface IncidentFeedCardProps {
  incident: Incident;
  selected: boolean;
  onClick: () => void;
}

const severityDot: Record<string, string> = {
  advisory: "bg-cyan-300",
  watch: "bg-amber-300",
  warning: "bg-orange-400",
  critical: "bg-red-400",
};

export function IncidentFeedCard({
  incident,
  selected,
  onClick,
}: IncidentFeedCardProps) {
  return (
    <button
      className={`w-full rounded-lg border-b border-white/[0.04] p-2.5 text-left transition last:border-b-0 ${
        selected
          ? "border-l-2 border-l-cyan-400/70 bg-cyan-400/8"
          : "border-l-2 border-l-transparent hover:bg-white/[0.04]"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${severityDot[incident.severity]}`}
        />
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-dim)]">
          {eventTypeLabel[incident.event_type]}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
          · {incident.severity}
        </span>
        <span className="ml-auto text-[10px] text-[var(--text-dim)]">
          {formatShortTime(incident.updated_at)}
        </span>
      </div>
      <p className="mt-1 truncate text-[13px] font-medium leading-5 text-white">
        {incident.title}
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
        {incident.region}
      </p>
    </button>
  );
}
