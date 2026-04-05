import { MapPin } from "lucide-react";
import type { PlaceRiskSummary } from "@/types/incident";
import { eventTypeLabel, formatShortTime } from "@/lib/incidents";

interface RiskSummaryProps {
  risk: PlaceRiskSummary;
  onSelectIncident: (id: string) => void;
}

const riskGradient: Record<PlaceRiskSummary["riskLevel"], string> = {
  safe: "from-emerald-500/10 to-transparent border-l-emerald-400/40",
  monitor: "from-amber-500/10 to-transparent border-l-amber-400/40",
  "at-risk": "from-orange-500/10 to-transparent border-l-orange-400/40",
  danger: "from-red-500/10 to-transparent border-l-red-400/40",
};

const riskHeadline: Record<PlaceRiskSummary["riskLevel"], string> = {
  safe: "Area looks clear",
  monitor: "Monitoring activity nearby",
  "at-risk": "Hazards detected near this area",
  danger: "Immediate threat detected",
};

const riskDescription: Record<PlaceRiskSummary["riskLevel"], string> = {
  safe: "No significant hazards detected within 100 km of this location.",
  monitor: "Some activity detected nearby. Stay aware and monitor updates.",
  "at-risk":
    "Active hazards are within range. Review incidents below and prepare accordingly.",
  danger:
    "A critical-level event is very close. Check if evacuation is needed.",
};

const severityDot: Record<string, string> = {
  advisory: "bg-cyan-300",
  watch: "bg-amber-300",
  warning: "bg-orange-400",
  critical: "bg-red-400",
};

export function RiskSummary({ risk, onSelectIncident }: RiskSummaryProps) {
  const { place, nearbyIncidents, riskLevel, nearestDistanceKm } = risk;

  return (
    <section
      className={`shrink-0 rounded-lg border border-white/10 border-l-2 bg-gradient-to-r p-3 ${riskGradient[riskLevel]}`}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Risk Summary
        </span>
        <span className="ml-auto text-[10px] text-[var(--text-dim)]">
          {place.label}
        </span>
      </div>

      {/* Headline */}
      <h3 className="mt-2 text-[15px] font-semibold leading-6 text-white">
        {riskHeadline[riskLevel]}
      </h3>
      <p className="mt-1 text-[12px] leading-[1.5] text-[var(--text-muted)]">
        {riskDescription[riskLevel]}
      </p>

      {/* Distance indicator */}
      {nearestDistanceKm !== null && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <MapPin className="h-3 w-3 shrink-0 text-[var(--text-dim)]" />
          <span>Nearest hazard: ~{Math.round(nearestDistanceKm)} km away</span>
        </div>
      )}

      {/* Nearby incidents list */}
      {nearbyIncidents.length > 0 && (
        <div className="mt-2.5 border-t border-white/6 pt-2">
          <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]">
            Nearby incidents ({nearbyIncidents.length})
          </p>
          <div className="space-y-1">
            {nearbyIncidents.slice(0, 5).map((inc) => (
              <button
                key={inc.id}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[0.04]"
                onClick={() => onSelectIncident(inc.id)}
                type="button"
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${severityDot[inc.severity]}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-white">
                    {inc.title}
                  </p>
                  <p className="text-[10px] text-[var(--text-dim)]">
                    {eventTypeLabel[inc.event_type]} · {inc.severity} ·{" "}
                    {formatShortTime(inc.updated_at)}
                  </p>
                </div>
              </button>
            ))}
            {nearbyIncidents.length > 5 && (
              <p className="px-2 text-[10px] text-[var(--text-dim)]">
                +{nearbyIncidents.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
