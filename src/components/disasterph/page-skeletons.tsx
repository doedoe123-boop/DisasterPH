function HeaderSkeleton() {
  return (
    <>
      <header className="hidden md:flex items-center justify-between border-b border-overlay/10 bg-[var(--bg-base)] px-5 py-1.5">
        <div className="flex items-center gap-3">
          <div className="loading-shimmer h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <div className="loading-shimmer h-3.5 w-28 rounded" />
            <div className="loading-shimmer h-2.5 w-36 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="rounded-lg border border-overlay/8 bg-overlay/[0.03] px-5 py-2.5"
            >
              <div className="loading-shimmer h-3 w-24 rounded" />
              <div className="loading-shimmer mt-1.5 h-2.5 w-20 rounded" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="loading-shimmer h-9 w-20 rounded-full" />
          <div className="loading-shimmer h-9 w-9 rounded-full" />
          <div className="loading-shimmer h-9 w-9 rounded-full" />
          <div className="loading-shimmer h-9 w-24 rounded-full" />
        </div>
      </header>

      <header className="flex md:hidden items-center justify-between border-b border-overlay/10 bg-[var(--bg-base)] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="loading-shimmer h-8 w-8 rounded-lg" />
          <div className="loading-shimmer h-3.5 w-24 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="loading-shimmer h-8 w-14 rounded-full" />
          <div className="loading-shimmer h-8 w-8 rounded-lg" />
          <div className="loading-shimmer h-8 w-12 rounded-lg" />
          <div className="loading-shimmer h-8 w-8 rounded-lg" />
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-[998] flex md:hidden border-t border-overlay/10 bg-[var(--bg-panel)] backdrop-blur-md safe-bottom">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
          >
            <div className="loading-shimmer h-5 w-5 rounded" />
            <div className="loading-shimmer h-2.5 w-12 rounded" />
          </div>
        ))}
      </nav>
    </>
  );
}

function SectionCard({
  className = "",
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-overlay/8 bg-[var(--bg-panel)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CommandCenterSkeleton() {
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground pb-[env(safe-area-inset-bottom)] md:pb-0">
      <HeaderSkeleton />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row overflow-hidden">
        <aside className="hidden lg:flex w-[300px] shrink-0 flex-col border-r border-overlay/10 bg-[var(--bg-panel-strong)]">
          <div className="flex items-center justify-between border-b border-overlay/8 px-5 py-4">
            <div className="loading-shimmer h-3 w-28 rounded" />
            <div className="loading-shimmer h-7 w-7 rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-px border-b border-overlay/8 bg-overlay/5">
            {[0, 1, 2].map((item) => (
              <div key={item} className="bg-[var(--bg-panel-strong)] px-4 py-4">
                <div className="loading-shimmer h-6 w-10 rounded" />
                <div className="loading-shimmer mt-2 h-2.5 w-12 rounded" />
              </div>
            ))}
          </div>
          <div className="flex-1 space-y-0.5 overflow-hidden p-0">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 border-b border-overlay/5 px-4 py-5"
              >
                <div className="loading-shimmer h-10 w-10 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="loading-shimmer h-3 w-24 rounded" />
                  <div className="loading-shimmer mt-2 h-4 w-full rounded" />
                  <div className="loading-shimmer mt-2 h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="border-b border-overlay/8 bg-[var(--bg-panel-strong)] px-4 py-3 md:px-5">
            <div className="flex gap-2 overflow-hidden">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-overlay/8 bg-[var(--bg-panel)] px-4 py-3"
                >
                  <div className="loading-shimmer h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          </div>

          <section className="relative h-[45vh] shrink-0 border-b border-overlay/10 bg-background md:h-auto md:min-h-0 md:flex-1">
            <div className="absolute inset-0 bg-background">
              <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgb(var(--ui-overlay) / 0.2) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--ui-overlay) / 0.2) 1px, transparent 1px)",
                  backgroundSize: "52px 52px",
                }}
              />
              {[["28%", "34%"], ["44%", "48%"], ["60%", "40%"], ["52%", "68%"]].map(
                ([left, top], item) => (
                  <div
                    key={item}
                    className="absolute h-3 w-3 rounded-full bg-orange-400/25 pulse-dot"
                    style={{ left, top }}
                  />
                ),
              )}
            </div>
            <div className="absolute left-4 top-4 hidden w-[320px] rounded-xl border border-overlay/10 bg-[var(--bg-panel)] p-4 shadow-[var(--shadow-elevated)] lg:block">
              <div className="loading-shimmer h-3 w-24 rounded" />
              <div className="loading-shimmer mt-3 h-5 w-5/6 rounded" />
              <div className="loading-shimmer mt-3 h-16 w-full rounded-xl" />
              <div className="loading-shimmer mt-3 h-3 w-1/2 rounded" />
              <div className="mt-3 flex gap-2">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="loading-shimmer h-6 w-20 rounded-md" />
                ))}
              </div>
            </div>
          </section>

          <section className="flex-1 border-t border-overlay/10 bg-[var(--bg-panel)]">
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-overlay/8 bg-[var(--bg-panel)] px-4 py-3 md:px-5">
              <div className="loading-shimmer h-3 w-12 rounded" />
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="loading-shimmer h-8 w-20 rounded-full" />
                ))}
              </div>
              <div className="ml-auto loading-shimmer h-3 w-16 rounded" />
            </div>
            <div className="space-y-0.5">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-4 border-b border-overlay/5 px-4 py-4 md:px-5"
                >
                  <div className="loading-shimmer h-11 w-11 rounded-xl" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="loading-shimmer h-5 w-[4.5rem] rounded-md" />
                      <div className="loading-shimmer h-3 w-20 rounded" />
                    </div>
                    <div className="loading-shimmer mt-2 h-4 w-5/6 rounded" />
                    <div className="loading-shimmer mt-2 h-3 w-full rounded" />
                    <div className="loading-shimmer mt-2 h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export function PulseFeedSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <HeaderSkeleton />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-10 pb-20 md:pb-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="loading-shimmer h-10 w-10 rounded-xl" />
            <div>
              <div className="loading-shimmer h-6 w-36 rounded" />
              <div className="loading-shimmer mt-2 hidden h-3 w-48 rounded sm:block" />
            </div>
          </div>
          <div className="loading-shimmer h-4 w-20 rounded" />
        </div>

        <div className="mt-6">
          <div className="loading-shimmer h-12 w-full rounded-xl" />
        </div>

        <div className="sticky top-0 z-10 mt-5 -mx-4 flex items-center gap-2 overflow-hidden bg-[var(--bg-base)] px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <div className="loading-shimmer h-4 w-4 rounded" />
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="loading-shimmer h-9 w-24 rounded-full" />
          ))}
          <div className="mx-1 h-5 w-px bg-overlay/12" />
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="loading-shimmer h-9 w-20 rounded-full" />
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <SectionCard key={item} className="p-4 md:p-5">
              <div className="flex items-start gap-3">
                <div className="loading-shimmer h-12 w-12 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="loading-shimmer h-5 w-20 rounded-md" />
                    <div className="loading-shimmer h-3 w-24 rounded" />
                  </div>
                  <div className="loading-shimmer mt-3 h-5 w-full rounded" />
                  <div className="loading-shimmer mt-2 h-4 w-5/6 rounded" />
                  <div className="loading-shimmer mt-3 h-3 w-2/3 rounded" />
                  <div className="mt-3 flex gap-2">
                    <div className="loading-shimmer h-7 w-20 rounded-md" />
                    <div className="loading-shimmer h-7 w-24 rounded-md" />
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      </main>
    </div>
  );
}

export function PulseDetailSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <HeaderSkeleton />

      <div className="px-4 pt-4 pb-2 sm:px-6 lg:px-8">
        <div className="loading-shimmer h-9 w-24 rounded-lg" />
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-24 md:pb-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="loading-shimmer h-5 w-20 rounded-sm" />
            <div className="loading-shimmer h-3 w-24 rounded" />
            <div className="loading-shimmer h-3 w-20 rounded" />
          </div>
          <div className="loading-shimmer mt-4 h-10 w-5/6 rounded" />
          <div className="loading-shimmer mt-4 h-20 w-full max-w-3xl rounded-xl" />
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="loading-shimmer h-4 w-24 rounded" />
            <div className="loading-shimmer h-4 w-36 rounded" />
            <div className="loading-shimmer h-10 w-28 rounded-lg" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <SectionCard className="p-5">
              <div className="flex items-center justify-between">
                <div className="loading-shimmer h-3 w-28 rounded" />
                <div className="loading-shimmer h-4 w-36 rounded" />
              </div>
              <div className="loading-shimmer mt-4 h-2 w-full rounded-full" />
            </SectionCard>
            <SectionCard className="p-5">
              <div className="loading-shimmer h-4 w-full rounded" />
              <div className="loading-shimmer mt-2 h-4 w-5/6 rounded" />
              <div className="loading-shimmer mt-2 h-4 w-2/3 rounded" />
            </SectionCard>
            <SectionCard className="p-5">
              <div className="loading-shimmer h-3 w-28 rounded" />
              <div className="mt-4 space-y-3">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="loading-shimmer mt-0.5 h-5 w-5 rounded-full" />
                    <div className="flex-1">
                      <div className="loading-shimmer h-4 w-2/3 rounded" />
                      <div className="loading-shimmer mt-1.5 h-3 w-full rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <aside className="space-y-6">
            <SectionCard className="p-5">
              <div className="loading-shimmer h-3 w-28 rounded" />
              <div className="mt-4 grid grid-cols-2 gap-4">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div key={item}>
                    <div className="loading-shimmer h-3 w-16 rounded" />
                    <div className="loading-shimmer mt-2 h-7 w-20 rounded" />
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard className="p-5">
              <div className="loading-shimmer h-3 w-32 rounded" />
              <div className="mt-4 space-y-3">
                {[0, 1].map((item) => (
                  <div key={item} className="loading-shimmer h-16 w-full rounded-lg" />
                ))}
              </div>
            </SectionCard>
            <SectionCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="loading-shimmer h-5 w-5 rounded" />
                <div className="flex-1">
                  <div className="loading-shimmer h-4 w-28 rounded" />
                  <div className="loading-shimmer mt-2 h-3 w-24 rounded" />
                </div>
              </div>
            </SectionCard>
          </aside>
        </div>
      </main>
    </div>
  );
}

export function SheltersSkeleton() {
  return (
    <div className="flex h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <HeaderSkeleton />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="w-full lg:max-w-sm border-r border-overlay/10 bg-[var(--bg-panel-strong)]">
          <div className="flex items-center justify-between border-b border-overlay/8 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="loading-shimmer h-9 w-9 rounded-xl" />
              <div>
                <div className="loading-shimmer h-5 w-28 rounded" />
                <div className="loading-shimmer mt-2 h-3 w-24 rounded" />
              </div>
            </div>
            <div className="loading-shimmer h-8 w-10 rounded-lg" />
          </div>
          <div className="px-4 pt-4 pb-1">
            <div className="loading-shimmer h-12 w-full rounded-xl" />
          </div>
          <div className="flex gap-2 px-4 py-3">
            <div className="loading-shimmer h-4 w-4 rounded" />
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="loading-shimmer h-10 w-20 rounded-xl" />
            ))}
          </div>
          <div className="space-y-4 px-4 pb-4">
            {[0, 1, 2].map((item) => (
              <SectionCard key={item} className="p-4">
                <div className="loading-shimmer h-3 w-20 rounded" />
                <div className="loading-shimmer mt-4 h-5 w-3/4 rounded" />
                <div className="loading-shimmer mt-3 h-4 w-full rounded" />
                <div className="loading-shimmer mt-4 h-3 w-24 rounded" />
                <div className="loading-shimmer mt-2 h-2.5 w-full rounded-full" />
                <div className="mt-4 flex flex-wrap gap-2">
                  {[0, 1, 2].map((chip) => (
                    <div key={chip} className="loading-shimmer h-7 w-16 rounded-lg" />
                  ))}
                </div>
              </SectionCard>
            ))}
          </div>
        </aside>

        <main className="hidden min-h-0 flex-1 lg:block">
          <div className="border-b border-overlay/8 px-6 py-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="loading-shimmer h-5 w-20 rounded-full" />
                <div className="loading-shimmer mt-4 h-8 w-80 rounded" />
                <div className="loading-shimmer mt-3 h-4 w-72 rounded" />
              </div>
              <div className="w-40">
                <div className="loading-shimmer ml-auto h-10 w-20 rounded" />
                <div className="loading-shimmer mt-4 h-2.5 w-full rounded-full" />
                <div className="loading-shimmer mt-3 h-4 w-24 rounded" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[0, 1, 2].map((item) => (
                <SectionCard key={item} className="p-5">
                  <div className="loading-shimmer h-3 w-20 rounded" />
                  <div className="loading-shimmer mt-3 h-5 w-3/4 rounded" />
                </SectionCard>
              ))}
            </div>
          </div>
          <div className="border-b border-overlay/8 px-6 py-4">
            <div className="flex gap-6">
              {[0, 1, 2].map((item) => (
                <div key={item} className="loading-shimmer h-7 w-24 rounded" />
              ))}
            </div>
          </div>
          <div className="p-6">
            <SectionCard className="p-6">
              <div className="loading-shimmer h-6 w-40 rounded" />
              <div className="loading-shimmer mt-6 h-5 w-full rounded" />
              <div className="loading-shimmer mt-3 h-5 w-4/5 rounded" />
              <SectionCard className="mt-6 p-6">
                <div className="loading-shimmer h-3 w-36 rounded" />
                <div className="mt-8 grid grid-cols-3 gap-8">
                  {[0, 1, 2].map((item) => (
                    <div key={item}>
                      <div className="loading-shimmer h-10 w-24 rounded" />
                      <div className="loading-shimmer mt-2 h-3 w-20 rounded" />
                    </div>
                  ))}
                </div>
                <div className="loading-shimmer mt-8 h-3 w-full rounded-full" />
              </SectionCard>
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
}
import type { ReactNode } from "react";
