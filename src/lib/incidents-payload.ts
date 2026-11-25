import { ensureFreshData } from "@/lib/ingest/scheduler";
import { getIncidents, getSourceHealth } from "@/lib/ingest/store";
import { buildDashboardStats, filterIncidentsByType } from "@/lib/incidents";
import type { DashboardStats, Incident, SourceStatus } from "@/types/incident";

/** What /api/incidents returns, and what the home page is rendered with. */
export interface IncidentsPayload {
  data: Incident[];
  meta: {
    count: number;
    filters: { type: string; source: string };
    stats: DashboardStats;
    sources: SourceStatus[];
    generated_at: string;
  };
}

/** Server only: current incidents (refreshed if the cache is stale). */
export async function buildIncidentsPayload(
  type: string | null = null,
  source: string | null = null,
): Promise<IncidentsPayload> {
  await ensureFreshData();
  const sourceHealth = getSourceHealth();
  let incidents = filterIncidentsByType(getIncidents(), type);
  if (source) incidents = incidents.filter((i) => i.source === source);
  return {
    data: incidents,
    meta: {
      count: incidents.length,
      filters: { type: type ?? "all", source: source ?? "all" },
      stats: buildDashboardStats(incidents, sourceHealth),
      sources: sourceHealth,
      generated_at: new Date().toISOString(),
    },
  };
}
