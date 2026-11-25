import { NextResponse } from "next/server";
import { ensureFreshData } from "@/lib/ingest/scheduler";
import { getIncidentById } from "@/lib/ingest/store";
import { withEqBulletin } from "@/lib/ingest/phivolcs-eq-bulletin";

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

  // PHIVOLCS earthquakes: add the bulletin's details (felt intensities,
  // expected damage and aftershocks, map). Unchanged if it can't be read.
  return NextResponse.json({ data: await withEqBulletin(incident) });
}
