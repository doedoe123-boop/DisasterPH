import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Server-only authorization for /api/push/dispatch.
 *
 * Dispatch fans a notification out to every stored subscriber, so it must only
 * be callable by a trusted server-side job holding PUSH_DISPATCH_SECRET. The
 * secret is never exposed through a NEXT_PUBLIC_ variable or sent to browsers.
 * When the secret is unset or too short, dispatch fails closed.
 */

export const MIN_PUSH_DISPATCH_SECRET_LENGTH = 32;

export type PushDispatchAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string; message: string };

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function authorizePushDispatch(
  authorizationHeader: string | null,
  secret: string | undefined = process.env.PUSH_DISPATCH_SECRET,
): PushDispatchAuthResult {
  if (!secret || secret.length < MIN_PUSH_DISPATCH_SECRET_LENGTH) {
    return {
      ok: false,
      status: 503,
      error: "push_dispatch_disabled",
      message: "Push dispatch is not configured.",
    };
  }

  const match = /^Bearer (.+)$/.exec(authorizationHeader ?? "");
  // Compare fixed-length digests so neither content nor length leaks via timing.
  if (!match || !timingSafeEqual(digest(match[1]), digest(secret))) {
    return {
      ok: false,
      status: 401,
      error: "unauthorized",
      message: "Missing or invalid dispatch credentials.",
    };
  }

  return { ok: true };
}
