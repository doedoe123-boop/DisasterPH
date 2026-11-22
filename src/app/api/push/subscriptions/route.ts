import { NextRequest } from "next/server";
import {
  deleteOwnedPushSubscription,
  getPushSubscription,
  insertPushSubscription,
  storedAuthSecret,
  updateOwnedPushSubscription,
  type PushSubscriptionRecord,
} from "@/lib/push-subscription-store";
import {
  authSecretMatches,
  parseOwnershipProof,
  parsePreferences,
  parseSubscription,
} from "@/lib/push-subscription-validation";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// There is intentionally no GET: subscriber endpoints and preferences are
// never listed. Callers only ever receive their own record back.

const MAX_BODY_BYTES = 8 * 1024;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function ownView(record: PushSubscriptionRecord) {
  return {
    endpoint: record.endpoint,
    regions: record.preferences.regions,
    minSeverity: record.preferences.minSeverity,
    webPushEnabled: record.preferences.webPushEnabled,
    updatedAt: record.updatedAt,
  };
}

async function readBody(
  request: NextRequest,
  bucket: string,
): Promise<{ body: Record<string, unknown> } | { response: Response }> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rl = rateLimit(`push-subscriptions:${bucket}:${ip}`, {
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.allowed) {
    return { response: json({ error: "rate_limited" }, 429) };
  }

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return { response: json({ error: "payload_too_large" }, 413) };
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    return { body: parsed as Record<string, unknown> };
  } catch {
    return { response: json({ error: "invalid_json" }, 400) };
  }
}

// POST — create a subscription, or update one the caller proves it owns.
//
// Status codes:
//   201 created · 200 owner update · 400 invalid payload
//   403 endpoint exists and keys.auth does not prove ownership
//       (existence can't be hidden here: an unknown endpoint would be created)
//   409 the record kept changing concurrently; safe to retry
//
// Every write is a single conditional statement: insert relies on the
// endpoint primary key, update is pinned to the verified auth secret. If one
// loses a race (concurrent create, or the row changed/vanished between read
// and write) the record is re-read and ownership re-checked, so a duplicate
// submit from the owner succeeds and anyone else still gets 403.
const MAX_WRITE_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  const read = await readBody(request, "write");
  if ("response" in read) return read.response;

  const subscription = parseSubscription(read.body.subscription);
  const preferences = parsePreferences(read.body.preferences);
  if (!subscription || !preferences) {
    return json(
      { error: "invalid_subscription", message: "Subscription or preferences failed validation." },
      400,
    );
  }

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    const existing = await getPushSubscription(subscription.endpoint);

    if (!existing) {
      const created = await insertPushSubscription(subscription, preferences);
      if (created) return json({ data: ownView(created) }, 201);
      continue; // another request created it first: re-read and check ownership
    }

    const stored = storedAuthSecret(existing);
    if (typeof stored !== "string" || !authSecretMatches(subscription.keys.auth, stored)) {
      return json({ error: "ownership_not_proven" }, 403);
    }

    const updated = await updateOwnedPushSubscription(stored, subscription, preferences);
    if (updated) return json({ data: ownView(updated) });
    // Row changed or was deleted after the ownership check: start over.
  }

  return json({ error: "concurrent_modification" }, 409);
}

// DELETE — remove a subscription the caller proves it owns.
//
// Status codes: 200 deleted · 400 missing endpoint/keys.auth ·
// 404 not deleted. Unknown endpoint, wrong secret, a record with no secret,
// and a row that changed before the pinned delete all return the identical
// 404, so DELETE reveals nothing about which endpoints exist.
export async function DELETE(request: NextRequest) {
  const read = await readBody(request, "delete");
  if ("response" in read) return read.response;

  const proof = parseOwnershipProof(read.body.subscription);
  if (!proof) {
    return json(
      { error: "invalid_ownership_proof", message: "Send the subscription endpoint and keys.auth." },
      400,
    );
  }

  // Unknown endpoint and wrong secret get the same response.
  const existing = await getPushSubscription(proof.endpoint);
  const stored = existing ? storedAuthSecret(existing) : undefined;
  if (
    !existing ||
    typeof stored !== "string" ||
    !authSecretMatches(proof.auth, stored) ||
    !(await deleteOwnedPushSubscription(proof.endpoint, stored))
  ) {
    return json({ error: "not_found" }, 404);
  }

  return json({ ok: true });
}
