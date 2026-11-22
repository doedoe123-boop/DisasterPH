import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireModerator } from "@/lib/moderator-auth";
import {
  MODERATION_REPORT_COLUMNS,
  UUID_PATTERN,
} from "@/lib/community-reports";

// Moderator identity is not individually verified yet (single shared
// ADMIN_TOKEN), so the attribution is fixed server-side, not client-supplied.
const MODERATOR_LABEL = "Moderator";

// PATCH /api/reports/[id] — approve or reject a report (moderators only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireModerator(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
  }

  let body: { status?: unknown; moderation_reason?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.status !== "approved" && body.status !== "rejected") {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const updates = {
    status: body.status,
    moderated_at: new Date().toISOString(),
    moderated_by: MODERATOR_LABEL,
    moderation_reason:
      body.moderation_reason != null && String(body.moderation_reason).trim()
        ? String(body.moderation_reason).slice(0, 200)
        : null,
  };

  const { data, error } = await getSupabaseAdmin()
    .from("community_reports")
    .update(updates)
    .eq("id", id)
    .select(MODERATION_REPORT_COLUMNS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not update report" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/reports/[id] — remove a report (moderators only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireModerator(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("community_reports")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not delete report" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
