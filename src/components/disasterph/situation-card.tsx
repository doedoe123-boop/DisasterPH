"use client";

import { eventTypeLabel, formatShortTime } from "@/lib/incidents";
import type { HelpAction, Incident } from "@/types/incident";
import type { PrepTip } from "@/lib/prep-guidance";
import { HelpActions } from "./help-actions";

interface SituationCardProps {
  incident: Incident;
  helpActions: HelpAction[];
  prepTips: PrepTip[];
  nearPlaceName?: string | null;
}

const severityBg: Record<string, string> = {
  advisory: "from-cyan-950/40 to-transparent border-l-cyan-400/40",
  watch: "from-amber-950/40 to-transparent border-l-amber-400/50",
  warning: "from-orange-950/40 to-transparent border-l-orange-400/60",
  critical: "from-red-950/50 to-transparent border-l-red-400/70",
};

const severityBadge: Record<string, string> = {
  advisory: "text-cyan-200 border-cyan-300/20 bg-cyan-300/10",
  watch: "text-amber-200 border-amber-300/20 bg-amber-300/10",
  warning: "text-orange-200 border-orange-300/20 bg-orange-300/10",
  critical: "text-red-200 border-red-300/20 bg-red-300/10",
};

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

  return (
    <section
      className={`shrink-0 rounded-xl border border-white/10 border-l-2 bg-gradient-to-r backdrop-blur ${severityBg[incident.severity]}`}
    >
      {/* ── Status Block ── */}
      <div className="p-3 pb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {eventTypeLabel[incident.event_type]}
          </span>
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${severityBadge[incident.severity]}`}
          >
            {incident.severity}
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
          <svg
            className="h-3 w-3 shrink-0 text-[var(--text-dim)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeWidth="1.5"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeWidth="1.5"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
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
                    ? "▸"
                    : tip.urgency === "soon"
                      ? "▹"
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

      {/* ── Metadata (collapsed) ── */}
      {Object.keys(incident.metadata).length > 0 && (
        <details className="group border-t border-white/6 px-3 py-2">
          <summary className="flex cursor-pointer items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)] hover:text-[var(--text-muted)]">
            <svg
              className="h-3 w-3 transition group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            Details
          </summary>
          <div className="mt-1.5 flex flex-wrap gap-1.5 overflow-hidden">
            {Object.entries(incident.metadata).map(([key, value]) => (
              <span
                key={key}
                className="max-w-full truncate rounded-full border border-white/8 bg-white/[0.03] px-2 py-1 text-[11px] text-[var(--text-muted)]"
              >
                {key}: {String(value)}
              </span>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
