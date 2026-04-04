import { NextResponse } from "next/server";
import { ensureFreshData } from "@/lib/ingest/scheduler";
import { getSourceHealth, getFetchLogs } from "@/lib/ingest/store";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureFreshData();

  return NextResponse.json({
    data: getSourceHealth(),
    logs: getFetchLogs().slice(-10),
    meta: { generated_at: new Date().toISOString() },
  });
}
