import type { WatchedPlace } from "@/types/incident";

interface WatchlistPanelProps {
  places: WatchedPlace[];
  onSelectPlace: (place: WatchedPlace) => void;
}

const severityIndicator: Record<string, string> = {
  advisory: "bg-cyan-400",
  watch: "bg-amber-400",
  warning: "bg-orange-400",
  critical: "bg-red-400",
};

export function WatchlistPanel({ places, onSelectPlace }: WatchlistPanelProps) {
  return (
    <section className="rounded-xl border border-white/8 bg-[var(--bg-panel)] backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          My Places
        </span>
        <button
          className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[var(--text-muted)] transition hover:bg-white/5 hover:text-white"
          type="button"
        >
          + Add
        </button>
      </div>

      <div className="space-y-0.5 p-1.5">
        {places.map((place) => (
          <button
            key={place.id}
            className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition hover:bg-white/[0.04]"
            onClick={() => onSelectPlace(place)}
            type="button"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03]">
              <svg
                className="h-3.5 w-3.5 text-[var(--text-muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">
                {place.label}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {place.region}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {place.activeHazards > 0 && place.highestSeverity ? (
                <>
                  <span
                    className={`h-2 w-2 rounded-full ${severityIndicator[place.highestSeverity]}`}
                  />
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {place.activeHazards}
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-emerald-300/60">Clear</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
