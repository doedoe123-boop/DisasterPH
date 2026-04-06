import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import {
  validateCategory,
  validateCoordinates,
  isHoneypotFilled,
} from "@/lib/report-validation";

export const dynamic = "force-dynamic";

// GET /api/reports — list all reports (newest first)
export async function GET() {
  const { data, error } = await getSupabase()
    .from("community_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  const body = await request.json();

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

  const { data, error } = await getSupabase()
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
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
