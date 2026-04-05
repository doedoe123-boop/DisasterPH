import type { PrepTip } from "@/lib/prep-guidance";

interface PrepGuidanceProps {
  tips: PrepTip[];
}

const urgencyStyle: Record<
  PrepTip["urgency"],
  { dot: string; label: string; text: string }
> = {
  now: { dot: "bg-red-400", label: "Do Now", text: "text-red-300" },
  soon: { dot: "bg-amber-300", label: "Prepare", text: "text-amber-300" },
  general: { dot: "bg-cyan-300", label: "Know", text: "text-cyan-300" },
};

export function PrepGuidance({ tips }: PrepGuidanceProps) {
  if (tips.length === 0) return null;

  return (
    <section className="rounded-lg border border-white/8 bg-[var(--bg-panel)]">
      <div className="border-b border-white/8 px-3 py-2">
        <span className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
          What To Do
        </span>
      </div>

      <div className="space-y-0.5 p-1.5">
        {tips.map((tip) => {
          const style = urgencyStyle[tip.urgency];
          return (
            <div
              key={tip.id}
              className="rounded-lg p-2.5 transition hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`}
                />
                <span
                  className={`text-[10px] font-medium uppercase tracking-wider ${style.text}`}
                >
                  {style.label}
                </span>
              </div>
              <p className="mt-1 text-[13px] font-medium leading-5 text-white">
                {tip.title}
              </p>
              <p className="mt-0.5 text-[12px] leading-[1.5] text-[var(--text-muted)]">
                {tip.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
