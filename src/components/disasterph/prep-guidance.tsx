import type { PrepTip } from "@/lib/prep-guidance";

interface PrepGuidanceProps {
  tips: PrepTip[];
  compact?: boolean;
  title?: string;
  subtitle?: string;
  maxItems?: number;
}

const urgencyStyle: Record<
  PrepTip["urgency"],
  { dot: string; label: string; text: string }
> = {
  now: { dot: "bg-red-400", label: "Do Now", text: "text-red-300" },
  soon: { dot: "bg-amber-300", label: "Prepare", text: "text-amber-300" },
  general: { dot: "bg-cyan-300", label: "Know", text: "text-cyan-300" },
};

export function PrepGuidance({
  tips,
  compact = false,
  title = "What To Do",
  subtitle,
  maxItems,
}: PrepGuidanceProps) {
  if (tips.length === 0) return null;

  const visibleTips =
    typeof maxItems === "number" ? tips.slice(0, maxItems) : tips;

  return (
    <section className="rounded-lg border border-overlay/8 bg-[var(--bg-panel)]">
      <div className="border-b border-overlay/8 px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          {title}
        </span>
        {subtitle && (
          <p className="mt-1 text-[12px] leading-5 text-[var(--text-muted)]">
            {subtitle}
          </p>
        )}
      </div>

      <div className="space-y-0.5 p-1.5">
        {visibleTips.map((tip) => {
          const style = urgencyStyle[tip.urgency];
          return (
            <div
              key={tip.id}
              className="rounded-lg p-2.5 transition hover:bg-overlay/[0.03]"
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                <span
                  className={`rounded-full border border-overlay/10 bg-overlay/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.text}`}
                >
                  {style.label}
                </span>
              </div>
              <p className="mt-1 text-[13px] font-medium leading-5 text-[var(--text-primary)]">
                {tip.title}
              </p>
              {!compact && (
                <p className="mt-0.5 text-[12px] leading-[1.5] text-[var(--text-muted)]">
                  {tip.body}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
