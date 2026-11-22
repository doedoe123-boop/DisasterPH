import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { PUBLIC_REPORT_COLUMNS } from "@/lib/community-reports";
import { rateLimit } from "@/lib/rate-limit";
import {
  validateCategory,
  validateCoordinates,
  isHoneypotFilled,
} from "@/lib/report-validation";

export const dynamic = "force-dynamic";

// GET /api/reports — approved reports only, public fields only (newest first)
export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("community_reports")
    .select(PUBLIC_REPORT_COLUMNS)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Could not load reports" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/reports — create a new report
export async function POST(request: NextRequest) {
  // ── Rate limit: 5 reports per IP per 10 minutes ──
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rl = rateLimit(ip, { maxRequests: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many reports. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Honeypot trap ──
  if (isHoneypotFilled(body)) {
    // Silently accept but don't insert (trick bots)
    return NextResponse.json(
      { data: { id: "00000000-0000-0000-0000-000000000000" } },
      { status: 201 },
    );
  }

  const {
    category,
    title,
    description,
    latitude,
    longitude,
    location_label,
    reporter_name,
  } = body;

  // ── Required fields ──
  if (
    !category ||
    !title ||
    latitude == null ||
    longitude == null ||
    !reporter_name ||
    !location_label
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  // ── Category allowlist ──
  if (!validateCategory(category)) {
    return NextResponse.json(
      { error: "Invalid report category" },
      { status: 400 },
    );
  }

  // ── Geofence + coordinate validation ──
  const coordCheck = validateCoordinates(latitude, longitude);
  if (!coordCheck.valid) {
    return NextResponse.json({ error: coordCheck.reason }, { status: 400 });
  }

  // Status and moderation fields never come from the client; the 003
  // migration's trigger also forces pending on every insert.
  const { data, error } = await getSupabaseAdmin()
    .from("community_reports")
    .insert({
      category,
      title: String(title).slice(0, 100),
      description: String(description ?? "").slice(0, 500),
      latitude: coordCheck.lat,
      longitude: coordCheck.lng,
      location_label: String(location_label).slice(0, 200),
      reporter_name: String(reporter_name).slice(0, 50),
      status: "pending",
    })
    .select(PUBLIC_REPORT_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not submit report" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
