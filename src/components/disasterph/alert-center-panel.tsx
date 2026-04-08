import { formatShortTime } from "@/lib/incidents";
import { severityLabel, visualFromSeverity } from "@/lib/severity";
import type { AlertEvent } from "@/types/incident";
import { StateCard } from "./state-card";

interface AlertCenterPanelProps {
  alerts: AlertEvent[];
  onSelectIncident: (incidentId: string) => void;
}

const triggerLabel: Record<AlertEvent["trigger"], string> = {
  "new-warning": "New warning",
  "new-critical": "New critical",
  escalation: "Escalation",
  "new-place-impact": "Place impact",
};

export function AlertCenterPanel({
  alerts,
  onSelectIncident,
}: AlertCenterPanelProps) {
  if (alerts.length === 0) {
    return (
      <StateCard
        compact
        message="No notification-eligible place alerts yet. This panel will surface warning and critical saved-place impacts."
        title="Eligible Alerts"
      />
    );
  }

  return (
    <section className="rounded-lg border border-white/8 bg-[var(--bg-panel)]">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          Eligible Alerts
        </span>
        <span className="text-[11px] text-[var(--text-dim)]">
          {alerts.length} queued
        </span>
      </div>

      <div className="space-y-0.5 p-1.5">
        {alerts.map((alert) => {
          const severityVisual = visualFromSeverity(alert.incidentSeverity);
          return (
            <button
              key={alert.id}
              className={`flex w-full items-start gap-2.5 rounded-lg border-l-2 px-2.5 py-2 text-left transition hover:bg-white/[0.04] ${severityVisual.accent}`}
              onClick={() => onSelectIncident(alert.incidentId)}
              type="button"
            >
              <span
                className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${severityVisual.dot}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${severityVisual.badge}`}
                  >
                    {triggerLabel[alert.trigger]}
                  </span>
                  <span className="text-[10px] text-[var(--text-dim)]">
                    {severityLabel[alert.incidentSeverity]}
                  </span>
                  <span
                    className="ml-auto text-[10px] text-[var(--text-dim)]"
                    suppressHydrationWarning
                  >
                    {formatShortTime(alert.updatedAt)}
                  </span>
                </div>
                <p className="mt-1 truncate text-[12px] font-medium text-white">
                  {alert.incidentTitle}
                </p>
                <p className="mt-0.5 text-[11px] leading-5 text-[var(--text-muted)]">
                  {alert.message}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
