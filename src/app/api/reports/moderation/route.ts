import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireModerator } from "@/lib/moderator-auth";
import { MODERATION_REPORT_COLUMNS } from "@/lib/community-reports";

export const dynamic = "force-dynamic";

// GET /api/reports/moderation — full queue (all statuses) for moderators only
export async function GET(request: NextRequest) {
  const auth = requireModerator(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("community_reports")
    .select(MODERATION_REPORT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "Could not load reports" }, { status: 500 });
  }

  return NextResponse.json(
    { data },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
