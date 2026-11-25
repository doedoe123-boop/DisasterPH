import { NextResponse } from "next/server";
import { buildIncidentsPayload } from "@/lib/incidents-payload";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json(
    await buildIncidentsPayload(searchParams.get("type"), searchParams.get("source")),
  );
}
