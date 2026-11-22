import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import {
  MODERATOR_COOKIE,
  clearModeratorCookie,
  createModeratorSession,
  isSameOrigin,
  moderationConfigured,
  setModeratorCookie,
  moderatorSessionExpiresAt,
  verifyAdminToken,
} from "@/lib/moderator-auth";

export const dynamic = "force-dynamic";

// GET /api/moderator/session — is the caller a signed-in moderator, and until when?
// expiresAt (unix seconds) lets the browser drop private data the moment the
// session ends instead of waiting for the next 401.
export async function GET(request: NextRequest) {
  const expiresAt = moderatorSessionExpiresAt(request.cookies.get(MODERATOR_COOKIE)?.value);
  return NextResponse.json(
    { moderator: expiresAt !== null, expiresAt },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// POST /api/moderator/session — exchange ADMIN_TOKEN for an HttpOnly session
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rl = rateLimit(`moderator-login:${ip}`, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  if (!moderationConfigured()) {
    return NextResponse.json({ error: "Moderation is not configured" }, { status: 503 });
  }

  let token: unknown;
  try {
    token = ((await request.json()) as { token?: unknown }).token;
  } catch {
    token = undefined;
  }

  const session = verifyAdminToken(token) ? createModeratorSession() : null;
  if (!session) {
    return NextResponse.json({ error: "Invalid moderator token" }, { status: 401 });
  }

  const response = NextResponse.json(
    { moderator: true, expiresAt: Number(session.split(".")[0]) },
    { headers: { "Cache-Control": "no-store" } },
  );
  setModeratorCookie(response, session);
  return response;
}

// DELETE /api/moderator/session — sign out
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  const response = NextResponse.json({ moderator: false });
  clearModeratorCookie(response);
  return response;
}
