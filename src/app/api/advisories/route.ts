import { NextResponse } from "next/server";
import { ensureFreshData } from "@/lib/ingest/scheduler";
import { getAdvisories } from "@/lib/ingest/store";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureFreshData();

  return NextResponse.json({
    data: getAdvisories(),
    meta: { generated_at: new Date().toISOString() },
  });
}
