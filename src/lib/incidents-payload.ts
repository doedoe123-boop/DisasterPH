import { ensureFreshData } from "@/lib/ingest/scheduler";
import { getIncidents, getSourceHealth, getTsunamiInfos } from "@/lib/ingest/store";
import { tsunamiForQuake, tsunamiMetadata } from "@/lib/ingest/phivolcs-tsunami";
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
  // Earthquakes PHIVOLCS evaluated for a tsunami carry its latest Tsunami
  // Information (including "no tsunami threat"), for their cards.
  const tsunami = getTsunamiInfos();
  const withTsunami = getIncidents().map((i) => {
    const info = tsunami.length ? tsunamiForQuake(i, tsunami) : null;
    return info ? { ...i, metadata: { ...i.metadata, ...tsunamiMetadata(info) } } : i;
  });
  let incidents = filterIncidentsByType(withTsunami, type);
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
