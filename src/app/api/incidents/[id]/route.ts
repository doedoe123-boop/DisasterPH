import { NextResponse } from "next/server";
import { ensureFreshData } from "@/lib/ingest/scheduler";
import { getIncidentById, getTsunamiInfos } from "@/lib/ingest/store";
import { tsunamiForQuake, tsunamiMetadata } from "@/lib/ingest/phivolcs-tsunami";
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
  const detailed = await withEqBulletin(incident);
  // And PHIVOLCS's Tsunami Information for it, when PHIVOLCS evaluated it.
  const tsunami = tsunamiForQuake(detailed, getTsunamiInfos());
  return NextResponse.json({
    data: tsunami ? { ...detailed, metadata: { ...detailed.metadata, ...tsunamiMetadata(tsunami) } } : detailed,
  });
}
