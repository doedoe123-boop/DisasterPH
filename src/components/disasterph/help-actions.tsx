import type { HelpAction } from "@/types/incident";

interface HelpActionsProps {
  actions: HelpAction[];
}

const iconPaths: Record<HelpAction["icon"], string> = {
  phone:
    "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  share:
    "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
  checklist:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  locate:
    "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  alert:
    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
};

const iconColor: Record<HelpAction["icon"], string> = {
  phone: "text-emerald-300",
  share: "text-cyan-300",
  checklist: "text-amber-300",
  locate: "text-blue-300",
  alert: "text-orange-300",
};

const buttonBorder: Record<HelpAction["icon"], string> = {
  phone: "hover:border-emerald-400/30",
  share: "hover:border-cyan-400/30",
  checklist: "hover:border-amber-400/30",
  locate: "hover:border-blue-400/30",
  alert: "hover:border-orange-400/30",
};

export function HelpActions({ actions }: HelpActionsProps) {
  return (
    <section className="rounded-xl border border-white/8 bg-[var(--bg-panel)] backdrop-blur">
      <div className="border-b border-white/8 px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          Help & Safety
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 p-2">
        {actions.slice(0, 4).map((action) => (
          <button
            key={action.id}
            className={`flex flex-col items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center transition hover:bg-white/[0.05] ${buttonBorder[action.icon]}`}
            type="button"
          >
            <svg
              className={`h-5 w-5 ${iconColor[action.icon]}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d={iconPaths[action.icon]}
              />
            </svg>
            <span className="text-[11px] font-medium text-white">
              {action.label}
            </span>
            <span className="text-[10px] leading-tight text-[var(--text-dim)]">
              {action.description}
            </span>
          </button>
        ))}

        {actions.length > 4 && (
          <button
            className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-orange-400/20 bg-orange-400/[0.06] p-3 transition hover:bg-orange-400/[0.1]"
            type="button"
          >
            <svg
              className="h-5 w-5 text-orange-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d={iconPaths[actions[4].icon]}
              />
            </svg>
            <div className="text-left">
              <span className="text-[12px] font-medium text-orange-200">
                {actions[4].label}
              </span>
              <span className="ml-1.5 text-[11px] text-orange-300/60">
                {actions[4].description}
              </span>
            </div>
          </button>
        )}
      </div>
    </section>
  );
}
