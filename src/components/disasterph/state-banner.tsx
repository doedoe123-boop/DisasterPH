interface StateBannerProps {
  tone: "danger" | "warning" | "info";
  title: string;
  message: string;
}

const toneStyle = {
  danger: "border-red-400/20 bg-red-400/10 text-red-200",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  info: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
} as const;

export function StateBanner({ tone, title, message }: StateBannerProps) {
  return (
    <div
      className={`mx-2 rounded-lg border px-3 py-2 text-xs ${toneStyle[tone]}`}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 opacity-90">{message}</p>
    </div>
  );
}
