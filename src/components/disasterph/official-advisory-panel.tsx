import type { OfficialAdvisory } from "@/types/incident";
import { formatShortTime } from "@/lib/incidents";

interface OfficialAdvisoryPanelProps {
  advisories: OfficialAdvisory[];
}

const severityBorder: Record<string, string> = {
  advisory: "border-l-cyan-400/50",
  watch: "border-l-amber-400/50",
  warning: "border-l-orange-400/50",
  critical: "border-l-red-400/50",
};

export function OfficialAdvisoryPanel({
  advisories,
}: OfficialAdvisoryPanelProps) {
  return (
    <section className="rounded-xl border border-white/8 bg-[var(--bg-panel)] backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          Official Alerts
        </span>
        <span className="text-[11px] text-[var(--text-dim)]">
          {advisories.length} active
        </span>
      </div>

      <div className="space-y-0.5 p-1.5">
        {advisories.map((advisory) => (
          <div
            key={advisory.id}
            className={`rounded-lg border-l-2 p-2.5 transition hover:bg-white/[0.03] ${severityBorder[advisory.severity]}`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-dim)]">
                {advisory.source}
              </span>
              <span className="ml-auto text-[10px] text-[var(--text-dim)]">
                {formatShortTime(advisory.issued_at)}
              </span>
            </div>
            <p className="mt-1 text-[13px] font-medium leading-5 text-white">
              {advisory.title}
            </p>
            <p className="mt-1 text-[12px] leading-[1.5] text-[var(--text-muted)]">
              {advisory.summary}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
