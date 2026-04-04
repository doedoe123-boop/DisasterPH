import { NextResponse } from "next/server";
import { mockIncidents, mockSourceStatuses } from "@/data/mock-incidents";
import { buildDashboardStats, filterIncidentsByType } from "@/lib/incidents";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const incidents = filterIncidentsByType(mockIncidents, type);

  return NextResponse.json({
    data: incidents,
    meta: {
      count: incidents.length,
      filters: { type: type ?? "all" },
      stats: buildDashboardStats(incidents),
      sources: mockSourceStatuses,
      generated_at: new Date().toISOString(),
    },
  });
}
