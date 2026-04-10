const sources = [
  { name: "PHIVOLCS", color: "bg-amber-400" },
  { name: "PAGASA", color: "bg-cyan-400" },
  { name: "EONET", color: "bg-emerald-400" },
];

export default function Loading() {
  return (
    <main className="h-screen overflow-hidden bg-[var(--bg-base)] p-2 text-[var(--text-primary)]">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-2 rounded-lg border border-overlay/8 bg-[var(--bg-panel)] p-2 shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
        {/* ── Top bar skeleton ── */}
        <div className="rounded-lg border border-overlay/8 bg-[var(--bg-panel)] overflow-hidden">
          {/* Threat headline placeholder */}
          <div className="flex items-center gap-3 border-b border-overlay/6 px-4 py-2.5">
            <div className="loading-shimmer h-2 w-2 rounded-full" />
            <div className="loading-shimmer h-3 w-48 rounded" />
            <div className="ml-auto loading-shimmer h-3 w-24 rounded" />
          </div>

          {/* Source strip */}
          <div className="flex items-center gap-4 border-b border-overlay/6 px-4 py-1.5">
            {sources.map((src) => (
              <div key={src.name} className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${src.color} pulse-dot opacity-50`}
                />
                <span className="text-[10px] text-[var(--text-dim)]">
                  {src.name}
                </span>
                <div className="loading-shimmer ml-1 h-2 w-12 rounded" />
              </div>
            ))}
          </div>

          {/* Header / filter bar */}
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="flex items-center gap-1.5">
              <div className="loading-shimmer h-4 w-4 rounded" />
              <span className="text-sm font-semibold text-[var(--text-dim)]">
                DisasterPH
              </span>
            </div>
            <div className="ml-4 flex gap-1.5">
              {["All", "Typhoon", "Flood", "Earthquake", "Volcano"].map((f) => (
                <div
                  key={f}
                  className="rounded-full border border-overlay/8 bg-overlay/[0.02] px-3 py-1"
                >
                  <span className="text-[11px] text-[var(--text-dim)]">
                    {f}
                  </span>
                </div>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/40 pulse-dot" />
              <span className="text-[10px] text-[var(--text-dim)]">Live</span>
            </div>
          </div>
        </div>

        {/* ── Main content grid ── */}
        <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[48px_minmax(0,1fr)_340px]">
          {/* Collapsed sidebar skeleton */}
          <aside className="hidden rounded-lg border border-overlay/8 bg-[var(--bg-panel)] lg:flex lg:flex-col lg:items-center lg:gap-3 lg:py-3">
            <div className="loading-shimmer h-6 w-6 rounded-lg" />
            <div className="mx-auto h-px w-5 bg-overlay/8" />
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-5 w-5 rounded-full loading-shimmer"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </aside>

          {/* Map viewport skeleton */}
          <section className="relative min-h-0 overflow-hidden rounded-lg border border-overlay/8">
            <div className="absolute inset-0 bg-background">
              {/* Grid texture */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgb(var(--ui-overlay) / 0.3) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--ui-overlay) / 0.3) 1px, transparent 1px)",
                  backgroundSize: "48px 48px",
                }}
              />

              {/* Simulated severity markers */}
              <div
                className="absolute left-[35%] top-[28%] h-3 w-3 rounded-full bg-amber-400/30 pulse-dot"
                style={{ animationDelay: "0s" }}
              />
              <div
                className="absolute left-[42%] top-[45%] h-2.5 w-2.5 rounded-full bg-red-400/25 pulse-dot"
                style={{ animationDelay: "0.6s" }}
              />
              <div
                className="absolute left-[55%] top-[35%] h-2 w-2 rounded-full bg-cyan-400/25 pulse-dot"
                style={{ animationDelay: "1.2s" }}
              />
              <div
                className="absolute left-[30%] top-[60%] h-2 w-2 rounded-full bg-orange-400/20 pulse-dot"
                style={{ animationDelay: "0.3s" }}
              />
              <div
                className="absolute left-[48%] top-[55%] h-3 w-3 rounded-full bg-amber-400/20 pulse-dot"
                style={{ animationDelay: "0.9s" }}
              />

              {/* Center loading indicator */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-4 rounded-lg border border-overlay/8 bg-[var(--bg-panel)] px-8 py-6">
                  <div className="relative h-8 w-8">
                    <div className="absolute inset-0 rounded-full border-2 border-overlay/10" />
                    <div
                      className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-400/60"
                      style={{ animationDuration: "1.8s" }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-[var(--text-muted)]">
                      Connecting to sources
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-3">
                      {sources.map((src, i) => (
                        <div key={src.name} className="flex items-center gap-1">
                          <span
                            className={`h-1 w-1 rounded-full ${src.color} pulse-dot`}
                            style={{ animationDelay: `${i * 0.4}s` }}
                          />
                          <span className="text-[10px] text-[var(--text-dim)]">
                            {src.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right panel skeleton */}
          <aside className="hidden flex-col gap-2 lg:flex">
            {/* Situation card skeleton */}
            <div className="rounded-lg border border-overlay/8 bg-[var(--bg-panel)] p-3">
              <div className="flex items-center gap-2">
                <div className="loading-shimmer h-5 w-14 rounded-full" />
                <div className="loading-shimmer h-3 w-20 rounded" />
              </div>
              <div className="loading-shimmer mt-2.5 h-4 w-3/4 rounded" />
              <div className="loading-shimmer mt-2 h-3 w-1/2 rounded" />
              <div className="mt-3 flex gap-1.5">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="loading-shimmer h-8 flex-1 rounded-lg"
                  />
                ))}
              </div>
            </div>

            {/* Advisory panel skeleton */}
            <div className="rounded-lg border border-overlay/8 bg-[var(--bg-panel)]">
              <div className="flex items-center justify-between border-b border-overlay/8 px-3 py-2">
                <div className="loading-shimmer h-2.5 w-20 rounded" />
                <div className="loading-shimmer h-2.5 w-12 rounded" />
              </div>
              <div className="space-y-1 p-2">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border-l-2 border-l-overlay/10 bg-overlay/[0.02] p-2.5"
                  >
                    <div className="loading-shimmer h-2.5 w-16 rounded" />
                    <div className="loading-shimmer mt-1.5 h-3 w-full rounded" />
                    <div className="loading-shimmer mt-1 h-2.5 w-2/3 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Feed skeleton */}
            <div className="flex-1 rounded-lg border border-overlay/8 bg-[var(--bg-panel)]">
              <div className="flex items-center justify-between border-b border-overlay/8 px-3 py-2">
                <div className="loading-shimmer h-2.5 w-24 rounded" />
                <div className="loading-shimmer h-2.5 w-16 rounded" />
              </div>
              <div className="space-y-0.5 p-1.5">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-lg p-2"
                  >
                    <div
                      className="loading-shimmer h-8 w-8 rounded-lg"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                    <div className="flex-1">
                      <div className="loading-shimmer h-3 w-3/4 rounded" />
                      <div className="loading-shimmer mt-1 h-2.5 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status bar skeleton */}
            <div className="flex items-center gap-2 rounded-lg border border-overlay/8 bg-[var(--bg-panel)] px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/40 pulse-dot" />
              <div className="loading-shimmer h-2 w-16 rounded" />
              <span className="text-[var(--text-dim)]">·</span>
              <div className="loading-shimmer h-2 w-12 rounded" />
              <span className="text-[var(--text-dim)]">·</span>
              <div className="loading-shimmer h-2 w-14 rounded" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
