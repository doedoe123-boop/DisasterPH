import type { SourceStatus } from "@/types/incident";

const statusDot: Record<string, string> = {
  healthy: "bg-emerald-400",
  delayed: "bg-amber-400",
  degraded: "bg-red-400",
};

export function SourceHealth({
  sourceStatuses,
}: {
  sourceStatuses: SourceStatus[];
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-[var(--bg-panel)] p-2.5 backdrop-blur">
      <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-dim)]">
        Source Health
      </p>
      <div className="space-y-1.5">
        {sourceStatuses.map((source) => (
          <div
            key={source.source}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${statusDot[source.status]}`}
              />
              <span className="text-[12px] text-white">{source.source}</span>
            </div>
            <span className="text-[11px] text-[var(--text-dim)]">
              {source.latency_ms}ms
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
