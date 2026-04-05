"use client";

import { MapPin } from "lucide-react";
import { eventTypeLabel, formatShortTime } from "@/lib/incidents";
import { severityLabel, visualFromSeverity } from "@/lib/severity";
import type { HelpAction, Incident } from "@/types/incident";
import type { PrepTip } from "@/lib/prep-guidance";
import { HelpActions } from "./help-actions";

interface SituationCardProps {
  incident: Incident;
  helpActions: HelpAction[];
  prepTips: PrepTip[];
  nearPlaceName?: string | null;
}

const urgencyColor: Record<string, string> = {
  now: "text-red-300",
  soon: "text-amber-300",
  general: "text-cyan-300/70",
};

export function SituationCard({
  incident,
  helpActions,
  prepTips,
  nearPlaceName,
}: SituationCardProps) {
  const topTips = prepTips.slice(0, 3);
  const severityVisual = visualFromSeverity(incident.severity);

  return (
    <section
      className={`shrink-0 rounded-lg border border-white/10 border-l-2 bg-gradient-to-r ${severityVisual.panel}`}
    >
      {/* ── Status Block ── */}
      <div className="p-3 pb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {eventTypeLabel[incident.event_type]}
          </span>
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${severityVisual.badge}`}
          >
            {severityLabel[incident.severity]}
          </span>
          {nearPlaceName && (
            <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 text-[9px] text-cyan-300">
              Near {nearPlaceName}
            </span>
          )}
          <span className="ml-auto text-[10px] text-[var(--text-dim)]">
            {incident.source} · {formatShortTime(incident.updated_at)}
          </span>
        </div>

        <h3 className="mt-2 text-[15px] font-semibold leading-6 text-white">
          {incident.title}
        </h3>

        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <MapPin className="h-3 w-3 shrink-0 text-[var(--text-dim)]" />
          <span>{incident.region}</span>
        </div>

        {incident.description && (
          <p className="mt-2 text-[12px] leading-[1.5] text-[var(--text-muted)] line-clamp-3">
            {incident.description}
          </p>
        )}
      </div>

      {/* ── Quick Actions ── */}
      {topTips.length > 0 && (
        <div className="border-t border-white/6 px-3 py-2">
          <p className="text-[9px] uppercase tracking-[0.22em] text-[var(--text-dim)] mb-1.5">
            What to do
          </p>
          <div className="space-y-1">
            {topTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span
                  className={`mt-0.5 text-[10px] font-bold uppercase ${urgencyColor[tip.urgency]}`}
                >
                  {tip.urgency === "now"
                    ? "✓"
                    : tip.urgency === "soon"
                      ? "✓"
                      : "·"}
                </span>
                <span className="text-[11px] leading-tight text-[var(--text-muted)]">
                  {tip.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action Buttons ── */}
      {helpActions.length > 0 && (
        <div className="border-t border-white/6 p-2">
          <HelpActions actions={helpActions} compact />
        </div>
      )}

      {/* ── Metadata ── */}
      {Object.keys(incident.metadata).length > 0 && (
        <div className="border-t border-white/6 px-3 py-3">
          <div className="flex flex-wrap gap-1.5 overflow-hidden">
            {Object.entries(incident.metadata).map(([key, value]) => (
              <span
                key={key}
                className={`max-w-full truncate rounded-full border px-2 py-1 text-[11px] ${
                  incident.severity === 'critical'
                    ? 'border-red-500/30 bg-red-500/20 text-red-200 font-medium'
                    : 'border-white/8 bg-white/[0.03] text-[var(--text-muted)]'
                }`}
              >
                {key}: {String(value)}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
