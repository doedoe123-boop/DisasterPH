interface StateCardProps {
  tone?: "neutral" | "warning" | "danger" | "info";
  title: string;
  message: string;
  compact?: boolean;
}

const toneStyle = {
  neutral: "border-overlay/8 bg-[var(--bg-panel)] text-[var(--text-muted)]",
  warning: "border-amber-400/15 bg-amber-400/8 text-amber-100",
  danger: "border-red-400/15 bg-red-400/8 text-red-100",
  info: "border-cyan-400/15 bg-cyan-400/8 text-cyan-100",
} as const;

export function StateCard({
  tone = "neutral",
  title,
  message,
  compact = false,
}: StateCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 text-center ${toneStyle[tone]} ${
        compact ? "text-xs" : "text-sm"
      }`}
    >
      <p className="font-medium text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 leading-5 opacity-90">{message}</p>
    </div>
  );
}
