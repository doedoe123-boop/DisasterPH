"use client";

import { eventTypeLabel, formatShortTime } from "@/lib/incidents";
import type { HelpAction, Incident } from "@/types/incident";

interface FloatingIncidentCardProps {
  incident: Incident;
  helpActions: HelpAction[];
}

const severityBadge: Record<string, string> = {
  advisory: "text-cyan-200 border-cyan-300/20 bg-cyan-300/10",
  watch: "text-amber-200 border-amber-300/20 bg-amber-300/10",
  warning: "text-orange-200 border-orange-300/20 bg-orange-300/10",
  critical: "text-red-200 border-red-300/20 bg-red-300/10",
};

const iconPaths: Record<string, string> = {
  phone:
    "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  share:
    "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
  link: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
};

export function FloatingIncidentCard({
  incident,
  helpActions,
}: FloatingIncidentCardProps) {
  // Show at most 3 quick action buttons
  const quickActions = helpActions
    .filter((a) => a.actionType === "call" || a.actionType === "link")
    .slice(0, 3);

  function handleQuickAction(action: HelpAction) {
    if (action.actionType === "call" && action.href)
      window.open(action.href, "_self");
    if (action.actionType === "link" && action.href)
      window.open(action.href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="absolute bottom-4 left-4 z-20 hidden w-72 rounded-xl border border-white/10 bg-[rgba(4,11,19,0.92)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-lg lg:block">
      <div className="p-3">
        <div className="flex items-center gap-1.5">
          <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {eventTypeLabel[incident.event_type]}
          </span>
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${severityBadge[incident.severity]}`}
          >
            {incident.severity}
          </span>
          <span className="ml-auto text-[10px] text-[var(--text-dim)]">
            {incident.source}
          </span>
        </div>
        <h3 className="mt-1.5 text-sm font-semibold leading-5 text-white">
          {incident.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <span>{incident.region}</span>
          <span className="text-[var(--text-dim)]">·</span>
          <span>{formatShortTime(incident.updated_at)}</span>
        </div>
      </div>

      {quickActions.length > 0 && (
        <div className="flex gap-1 border-t border-white/8 px-2 py-1.5">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1 text-[10px] text-[var(--text-muted)] transition hover:bg-white/[0.06] hover:text-white"
              onClick={() => handleQuickAction(action)}
              title={action.label}
              type="button"
            >
              <svg
                className="h-3 w-3 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d={iconPaths[action.icon] ?? iconPaths.link}
                />
              </svg>
              <span className="truncate">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
