import type { DashboardStats } from "@/types/incident";

export function QuickStats({ stats }: { stats: DashboardStats }) {
  return (
    <div className="flex gap-1 rounded-lg border border-white/8 bg-[var(--bg-panel)] p-2">
      <Stat label="Active" value={stats.activeAlerts} />
      <Stat label="Priority" value={stats.criticalAlerts} />
      <Stat label="Sources" value={stats.sourcesOnline} />
      <Stat label="Regions" value={stats.regionsTracked} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-lg bg-white/[0.03] py-1.5 text-center">
      <p className="text-base font-semibold text-white">{value}</p>
      <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
        {label}
      </p>
    </div>
  );
}
