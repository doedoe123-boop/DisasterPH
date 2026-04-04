import { NextResponse } from "next/server";
import { ensureFreshData } from "@/lib/ingest/scheduler";
import { getIncidents, getSourceHealth } from "@/lib/ingest/store";
import { buildDashboardStats, filterIncidentsByType } from "@/lib/incidents";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureFreshData();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const source = searchParams.get("source");

  let incidents = getIncidents();
  incidents = filterIncidentsByType(incidents, type);
  if (source) {
    incidents = incidents.filter((i) => i.source === source);
  }

  return NextResponse.json({
    data: incidents,
    meta: {
      count: incidents.length,
      filters: { type: type ?? "all", source: source ?? "all" },
      stats: buildDashboardStats(incidents),
      sources: getSourceHealth(),
      generated_at: new Date().toISOString(),
    },
  });
}
