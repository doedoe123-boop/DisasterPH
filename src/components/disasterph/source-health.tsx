import type { SourceStatus } from "@/types/incident";
import { formatShortTime } from "@/lib/incidents";
import { sourceStatusVisual } from "@/lib/severity";
import { StateCard } from "./state-card";

export function SourceHealth({
  sourceStatuses,
}: {
  sourceStatuses: SourceStatus[];
}) {
  return (
    <div className="rounded-lg border border-white/8 bg-[var(--bg-panel)] p-2.5">
      <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-dim)]">
        Source Health
      </p>
      <div className="space-y-1.5">
        {sourceStatuses.length > 0 ? (
          sourceStatuses.map((source) => (
            <div
              key={source.source}
              className="rounded-md border border-white/6 bg-white/[0.02] px-2 py-1.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${sourceStatusVisual[source.status].dot}`}
                  />
                  <span className="text-[12px] text-white">
                    {source.source}
                  </span>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-[0.16em] ${sourceStatusVisual[source.status].tone}`}
                >
                  {sourceStatusVisual[source.status].label}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--text-dim)]">
                <span>Updated {formatShortTime(source.last_fetch_at)}</span>
                <span>
                  {source.latency_ms > 0
                    ? `${source.latency_ms}ms`
                    : "No latency"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <StateCard
            compact
            message="Source health data is not yet available. This usually resolves on the next refresh cycle."
            title="Waiting for source status"
            tone="info"
          />
        )}
      </div>
    </div>
  );
}
