import { NextResponse } from "next/server";
import { ensureFreshData } from "@/lib/ingest/scheduler";
import { getIncidentById } from "@/lib/ingest/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureFreshData();

  const { id } = await params;
  const incident = getIncidentById(decodeURIComponent(id));

  if (!incident) {
    return NextResponse.json({ error: "Incident not found" }, { status: 404 });
  }

  return NextResponse.json({ data: incident });
}
