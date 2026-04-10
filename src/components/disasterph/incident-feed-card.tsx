import { eventTypeLabel, formatShortTime } from "@/lib/incidents";
import { severityLabel, visualFromSeverity } from "@/lib/severity";
import type { Incident } from "@/types/incident";

interface IncidentFeedCardProps {
  incident: Incident;
  selected: boolean;
  hovered: boolean;
  nearPlaceName?: string | null;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function IncidentFeedCard({
  incident,
  selected,
  hovered,
  nearPlaceName,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: IncidentFeedCardProps) {
  const isCritical =
    incident.severity === "critical" || incident.severity === "warning";
  const severityVisual = visualFromSeverity(incident.severity);

  return (
    <button
      className={`w-full rounded-lg border-l-2 text-left transition last:border-b-0 ${
        selected
          ? "border-l-cyan-400/70 bg-cyan-400/8"
          : hovered
            ? "border-l-cyan-400/30 bg-cyan-400/[0.04]"
            : `${severityVisual.accent} hover:bg-overlay/[0.04]`
      } ${isCritical ? "p-4 border-b border-overlay/[0.06]" : "px-3.5 py-3 border-b border-overlay/[0.04]"}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      type="button"
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`shrink-0 rounded-full ${severityVisual.dot} ${isCritical ? "h-2 w-2" : "h-1.5 w-1.5"}`}
        />
        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-dim)]">
          {eventTypeLabel[incident.event_type]}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
          · {severityLabel[incident.severity]}
        </span>
        {nearPlaceName && (
          <span className="ml-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-px text-[9px] text-cyan-300">
            Near {nearPlaceName}
          </span>
        )}
        <span
          className="ml-auto text-[10px] text-[var(--text-dim)]"
          suppressHydrationWarning
        >
          {formatShortTime(incident.updated_at)}
        </span>
      </div>
      <p
        className={`mt-2 truncate font-semibold leading-relaxed text-[var(--text-primary)] ${isCritical ? "text-[15px]" : "text-[14px]"}`}
      >
        {incident.title}
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
        {incident.region}
      </p>
    </button>
  );
}
