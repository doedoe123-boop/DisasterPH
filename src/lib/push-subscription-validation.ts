import { createHash, timingSafeEqual } from "node:crypto";
import type {
  NotificationPrefs,
  StoredPushSubscription,
} from "@/lib/notifications";
import { isAllowedPushEndpoint } from "@/lib/push-destination";

/**
 * Schema checks for /api/push/subscriptions plus the ownership proof.
 *
 * Ownership: a browser's PushSubscription carries `keys.auth`, a 16-byte
 * secret shared only between that browser and this server (push services never
 * see it). Presenting endpoint + matching auth secret proves the caller holds
 * the subscription, which works for subscriptions stored before this check
 * existed without asking users to re-enroll.
 */

const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;
const MAX_REGIONS = 32;
const MAX_REGION_LENGTH = 64;

function decodeBase64Url(value: unknown, expectedBytes: number): Buffer | null {
  if (typeof value !== "string" || !BASE64URL.test(value)) return null;
  const bytes = Buffer.from(value.replace(/=+$/, ""), "base64url");
  return bytes.length === expectedBytes ? bytes : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSubscription(value: unknown): StoredPushSubscription | null {
  if (!isPlainObject(value) || !isPlainObject(value.keys)) return null;
  if (!isAllowedPushEndpoint(value.endpoint)) return null;

  const p256dh = decodeBase64Url(value.keys.p256dh, 65);
  if (!p256dh || p256dh[0] !== 0x04) return null; // uncompressed P-256 point
  if (!decodeBase64Url(value.keys.auth, 16)) return null;

  const expirationTime = value.expirationTime ?? null;
  if (
    expirationTime !== null &&
    (typeof expirationTime !== "number" || !Number.isFinite(expirationTime))
  ) {
    return null;
  }

  // Rebuild from known fields only so nothing else is persisted. Keys are
  // stored unpadded (as browsers emit them) so the stored auth string that
  // writes are pinned to is canonical.
  const unpad = (s: unknown) => (s as string).replace(/=+$/, "");
  return {
    endpoint: value.endpoint,
    expirationTime,
    keys: { p256dh: unpad(value.keys.p256dh), auth: unpad(value.keys.auth) },
  };
}

export function parsePreferences(value: unknown): NotificationPrefs | null {
  if (!isPlainObject(value)) return null;
  const { enabled, webPushEnabled, minSeverity, regions, escalations, newPlaceImpacts } = value;

  if (
    typeof enabled !== "boolean" ||
    typeof webPushEnabled !== "boolean" ||
    (minSeverity !== "warning" && minSeverity !== "critical") ||
    typeof escalations !== "boolean" ||
    typeof newPlaceImpacts !== "boolean" ||
    !Array.isArray(regions) ||
    regions.length > MAX_REGIONS ||
    !regions.every(
      (r) => typeof r === "string" && r.length > 0 && r.length <= MAX_REGION_LENGTH,
    )
  ) {
    return null;
  }

  return {
    enabled,
    webPushEnabled,
    minSeverity,
    regions: [...new Set(regions as string[])],
    escalations,
    newPlaceImpacts,
  };
}

/** Endpoint + auth secret presented by the caller, shape-checked only. */
export function parseOwnershipProof(
  value: unknown,
): { endpoint: string; auth: string } | null {
  if (!isPlainObject(value) || !isPlainObject(value.keys)) return null;
  if (typeof value.endpoint !== "string" || value.endpoint.length > 2048) return null;
  if (!decodeBase64Url(value.keys.auth, 16)) return null;
  return { endpoint: value.endpoint, auth: value.keys.auth as string };
}

/** Constant-time comparison of a presented auth secret against a stored one. */
export function authSecretMatches(presented: string, stored: unknown): boolean {
  const a = decodeBase64Url(presented, 16);
  const b = decodeBase64Url(stored, 16);
  if (!a || !b) return false; // legacy rows without a valid secret can't be proven
  const da = createHash("sha256").update(a).digest();
  const db = createHash("sha256").update(b).digest();
  return timingSafeEqual(da, db);
}
