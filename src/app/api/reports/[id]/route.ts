import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isValidAdminToken } from "@/lib/report-validation";

// PATCH /api/reports/[id] — moderate (approve/reject) or update a report
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // ── Admin-only ──
  if (!isValidAdminToken(request.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};

  if (body.status && ["approved", "rejected"].includes(body.status)) {
    updates.status = body.status;
    updates.moderated_at = new Date().toISOString();
    updates.moderated_by = body.moderated_by
      ? String(body.moderated_by).slice(0, 50)
      : "Moderator";
    if (body.moderation_reason != null) {
      updates.moderation_reason = String(body.moderation_reason).slice(0, 200);
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const { data, error } = await getSupabase()
    .from("community_reports")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/reports/[id] — remove a report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // ── Admin-only ──
  if (!isValidAdminToken(request.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await getSupabase()
    .from("community_reports")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
