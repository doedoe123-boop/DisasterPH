export default function Loading() {
  return (
    <main className="dashboard-grid min-h-screen overflow-hidden bg-[var(--bg-base)] p-4 text-[var(--text-primary)] md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1600px] flex-col gap-4 rounded-[28px] border border-white/10 bg-[rgba(4,12,20,0.84)] p-4 md:p-5">
        <div className="loading-shimmer h-20 rounded-[24px]" />
        <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="loading-shimmer rounded-[28px]" />
          <div className="hidden gap-4 lg:grid lg:grid-rows-[1.2fr_1fr_auto_auto]">
            <div className="loading-shimmer rounded-[24px]" />
            <div className="loading-shimmer rounded-[24px]" />
            <div className="loading-shimmer rounded-[24px]" />
            <div className="loading-shimmer rounded-[24px]" />
          </div>
        </div>
      </div>
    </main>
  );
}
