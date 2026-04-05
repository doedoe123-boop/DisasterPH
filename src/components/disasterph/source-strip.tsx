"use client";

import type { SourceStatus } from "@/types/incident";

const statusDot: Record<string, string> = {
  healthy: "bg-emerald-400",
  delayed: "bg-amber-400",
  degraded: "bg-red-400",
};

const statusLabel: Record<string, string> = {
  healthy: "Live",
  delayed: "Delayed",
  degraded: "Down",
};

interface SourceStripProps {
  sources: SourceStatus[];
}

export function SourceStrip({ sources }: SourceStripProps) {
  if (sources.length === 0) return null;

  const allHealthy = sources.every((s) => s.status === "healthy");

  return (
    <div
      className={`flex items-center gap-3 px-3 py-1 border-b text-[10px] ${
        allHealthy
          ? "border-white/5 bg-transparent"
          : "border-amber-400/10 bg-amber-950/20"
      }`}
    >
      <span className="text-[var(--text-dim)] uppercase tracking-[0.18em] shrink-0">
        Sources
      </span>
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
        {sources.map((source) => (
          <div
            key={source.source}
            className="flex items-center gap-1.5 shrink-0"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusDot[source.status]}`}
            />
            <span className="text-[var(--text-muted)]">{source.source}</span>
            <span className="text-[var(--text-dim)]">
              {statusLabel[source.status]}
              {source.status !== "healthy" && source.latency_ms > 0
                ? ` (${source.latency_ms}ms)`
                : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
