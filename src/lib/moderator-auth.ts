import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Server-verified moderator access for community reports.
 *
 * There are no user accounts yet. A moderator signs in once by submitting the
 * server-only ADMIN_TOKEN to /api/moderator/session; the server verifies it and
 * issues a short-lived, HMAC-signed, HttpOnly session cookie. The token itself
 * is never shipped to browsers or stored client-side. Rotating ADMIN_TOKEN
 * invalidates every outstanding session.
 */

export const MODERATOR_COOKIE = "disasterph_moderator";
export const MODERATOR_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const MIN_ADMIN_TOKEN_LENGTH = 32;

const SESSION_CONTEXT = "disasterph-moderator-session:v1";

function configuredToken(): string | null {
  const token = process.env.ADMIN_TOKEN;
  return token && token.length >= MIN_ADMIN_TOKEN_LENGTH ? token : null;
}

function safeEqual(a: string, b: string): boolean {
  const da = createHash("sha256").update(a, "utf8").digest();
  const db = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(da, db);
}

function sign(token: string, expiresAt: number): string {
  return createHmac("sha256", token)
    .update(`${SESSION_CONTEXT}:${expiresAt}`)
    .digest("base64url");
}

/** Whether moderator sign-in is possible at all (ADMIN_TOKEN configured). */
export function moderationConfigured(): boolean {
  return configuredToken() !== null;
}

/** Constant-time check of a submitted ADMIN_TOKEN. Fails closed when unset. */
export function verifyAdminToken(candidate: unknown): boolean {
  const token = configuredToken();
  if (!token || typeof candidate !== "string" || candidate.length === 0) {
    return false;
  }
  return safeEqual(candidate, token);
}

export function createModeratorSession(now = Date.now()): string | null {
  const token = configuredToken();
  if (!token) return null;
  const expiresAt = Math.floor(now / 1000) + MODERATOR_SESSION_TTL_SECONDS;
  return `${expiresAt}.${sign(token, expiresAt)}`;
}

/** Expiry (unix seconds) of a valid session, or null if invalid/expired. */
export function moderatorSessionExpiresAt(
  value: string | undefined,
  now = Date.now(),
): number | null {
  const token = configuredToken();
  if (!token || !value) return null;

  const match = /^(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match) return null;

  const expiresAt = Number(match[1]);
  if (expiresAt <= Math.floor(now / 1000)) return null;

  return safeEqual(match[2], sign(token, expiresAt)) ? expiresAt : null;
}

export function verifyModeratorSession(
  value: string | undefined,
  now = Date.now(),
): boolean {
  return moderatorSessionExpiresAt(value, now) !== null;
}

/**
 * Reject cross-site state-changing requests. Browsers always send Origin on
 * cross-origin POST/PATCH/DELETE; same-origin requests either omit it or match.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export type ModeratorCheck =
  | { ok: true }
  | { ok: false; status: 401 | 403 | 503; error: string };

export function requireModerator(request: NextRequest): ModeratorCheck {
  if (!moderationConfigured()) {
    return { ok: false, status: 503, error: "Moderation is not configured" };
  }
  if (!isSameOrigin(request)) {
    return { ok: false, status: 403, error: "Cross-origin request rejected" };
  }
  if (!verifyModeratorSession(request.cookies.get(MODERATOR_COOKIE)?.value)) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  return { ok: true };
}

export function setModeratorCookie(response: NextResponse, value: string) {
  response.cookies.set(MODERATOR_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MODERATOR_SESSION_TTL_SECONDS,
  });
}

export function clearModeratorCookie(response: NextResponse) {
  response.cookies.set(MODERATOR_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
