import type { IncidentEventType } from "@/types/incident";

interface HeaderProps {
  activeFilter: IncidentEventType | "all";
  filters: Array<{ label: string; value: IncidentEventType | "all" }>;
  onFilterChange: (value: IncidentEventType | "all") => void;
}

export function AppHeader({
  activeFilter,
  filters,
  onFilterChange,
}: HeaderProps) {
  return (
    <header className="flex items-center gap-3 rounded-xl border border-white/8 bg-[var(--bg-panel)] px-3 py-2 backdrop-blur-lg">
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/10">
          <svg
            className="h-4 w-4 text-cyan-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">
          BantayPH
        </span>
      </div>

      <div className="h-4 w-px shrink-0 bg-white/10" />

      <div className="flex min-w-0 gap-1 overflow-x-auto scrollbar-none">
        {filters.map((filter) => {
          const active = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              className={`shrink-0 rounded-full px-3 py-1 text-xs transition ${
                active
                  ? "border border-cyan-300/35 bg-cyan-300/12 text-cyan-100"
                  : "border border-transparent text-[var(--text-muted)] hover:bg-white/5 hover:text-white"
              }`}
              onClick={() => onFilterChange(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2.5">
        <span className="hidden text-[11px] text-[var(--text-dim)] sm:inline">
          Updated 5m ago
        </span>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(57,217,138,0.9)]" />
          Live
        </div>
      </div>
    </header>
  );
}
