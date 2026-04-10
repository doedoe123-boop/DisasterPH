import type { Incident, IncidentSeverity } from "@/types/incident";
import { eventTypeLabel } from "@/lib/incidents";

interface AreaRiskSummaryProps {
  region: string;
  incidents: Incident[];
}

const severityOrder: IncidentSeverity[] = [
  "critical",
  "warning",
  "watch",
  "advisory",
];

const severityColor: Record<IncidentSeverity, string> = {
  critical: "text-red-300 bg-red-400/10 border-red-400/20",
  warning: "text-orange-300 bg-orange-400/10 border-orange-400/20",
  watch: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  advisory: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
};

const severityBg: Record<IncidentSeverity, string> = {
  critical: "bg-red-400",
  warning: "bg-orange-400",
  watch: "bg-amber-400",
  advisory: "bg-cyan-400",
};

export function AreaRiskSummary({ region, incidents }: AreaRiskSummaryProps) {
  const nearby = incidents.filter((i) => i.region === region);
  const highest = severityOrder.find((s) =>
    nearby.some((i) => i.severity === s),
  );

  if (nearby.length === 0) {
    return (
      <section className="rounded-lg border border-overlay/8 bg-[var(--bg-panel)] p-3">
        <p className="mb-1.5 text-[9px] uppercase tracking-[0.26em] text-[var(--text-dim)]">
          Area Risk
        </p>
        <p className="text-[13px] text-[var(--text-muted)]">
          No active hazards detected near{" "}
          <span className="text-[var(--text-primary)]">{region}</span>.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-overlay/8 bg-[var(--bg-panel)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-[0.26em] text-[var(--text-dim)]">
          Area Risk — {region}
        </p>
        {highest && (
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${severityColor[highest]}`}
          >
            {highest}
          </span>
        )}
      </div>

      {/* severity breakdown bar */}
      <div className="mb-2.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        {severityOrder.map((s) => {
          const count = nearby.filter((i) => i.severity === s).length;
          if (count === 0) return null;
          return (
            <div
              key={s}
              className={`${severityBg[s]} rounded-full`}
              style={{ flex: count }}
            />
          );
        })}
      </div>

      <div className="space-y-1.5">
        {nearby.map((incident) => (
          <div key={incident.id} className="flex items-start gap-2 text-[12px]">
            <span
              className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${severityBg[incident.severity]}`}
            />
            <div className="min-w-0">
              <span className="text-[var(--text-muted)]">
                {eventTypeLabel[incident.event_type]}
              </span>
              <span className="text-[var(--text-dim)]"> — </span>
              <span className="text-[var(--text-primary)]">{incident.title}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
