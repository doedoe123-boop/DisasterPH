import {
  normalizeNotificationPrefs,
  type NotificationPrefs,
  type StoredPushSubscription,
} from "@/lib/notifications";
import { getSupabaseAdmin } from "@/lib/supabase";

export interface PushSubscriptionRecord {
  endpoint: string;
  subscription: StoredPushSubscription;
  preferences: NotificationPrefs;
  createdAt: string;
  updatedAt: string;
}

interface PushSubscriptionRow {
  endpoint: string;
  subscription: StoredPushSubscription;
  preferences: Partial<NotificationPrefs>;
  created_at: string;
  updated_at: string;
}

/** Column path used to pin writes to the auth secret that was verified. */
const AUTH_PATH = "subscription->keys->>auth";

const globalForPush = globalThis as typeof globalThis & {
  disasterphPushSubscriptions?: Map<string, PushSubscriptionRecord>;
};

const memoryStore =
  globalForPush.disasterphPushSubscriptions ??
  new Map<string, PushSubscriptionRecord>();

globalForPush.disasterphPushSubscriptions = memoryStore;

function canUseSupabase() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function rowToRecord(row: PushSubscriptionRow): PushSubscriptionRecord {
  return {
    endpoint: row.endpoint,
    subscription: row.subscription,
    preferences: normalizeNotificationPrefs(row.preferences ?? {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function storedAuthSecret(record: PushSubscriptionRecord): unknown {
  return (record.subscription as Partial<StoredPushSubscription> | null)?.keys?.auth;
}

export async function getPushSubscription(
  endpoint: string,
): Promise<PushSubscriptionRecord | null> {
  if (!canUseSupabase()) return memoryStore.get(endpoint) ?? null;

  const { data, error } = await getSupabaseAdmin()
    .from("push_subscriptions")
    .select("*")
    .eq("endpoint", endpoint)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToRecord(data as PushSubscriptionRow) : null;
}

/** Create a new record. Returns null if the endpoint already exists. */
export async function insertPushSubscription(
  subscription: StoredPushSubscription,
  preferences: NotificationPrefs,
): Promise<PushSubscriptionRecord | null> {
  const now = new Date().toISOString();

  if (!canUseSupabase()) {
    if (memoryStore.has(subscription.endpoint)) return null;
    const record = {
      endpoint: subscription.endpoint,
      subscription,
      preferences,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.set(subscription.endpoint, record);
    return record;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("push_subscriptions")
    .insert({ endpoint: subscription.endpoint, subscription, preferences, updated_at: now })
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") return null; // concurrent insert of same endpoint
    throw new Error(error.message);
  }
  return data ? rowToRecord(data as PushSubscriptionRow) : null;
}

/**
 * Update a record only if its stored auth secret is still `verifiedAuth`
 * (the value the caller already proved). Returns null if it changed.
 */
export async function updateOwnedPushSubscription(
  verifiedAuth: string,
  subscription: StoredPushSubscription,
  preferences: NotificationPrefs,
): Promise<PushSubscriptionRecord | null> {
  const now = new Date().toISOString();

  if (!canUseSupabase()) {
    const existing = memoryStore.get(subscription.endpoint);
    if (!existing || storedAuthSecret(existing) !== verifiedAuth) return null;
    const record = { ...existing, subscription, preferences, updatedAt: now };
    memoryStore.set(subscription.endpoint, record);
    return record;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("push_subscriptions")
    .update({ subscription, preferences, updated_at: now })
    .eq("endpoint", subscription.endpoint)
    .eq(AUTH_PATH, verifiedAuth)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToRecord(data as PushSubscriptionRow) : null;
}

/** Delete a record only if its stored auth secret is still `verifiedAuth`. */
export async function deleteOwnedPushSubscription(
  endpoint: string,
  verifiedAuth: string,
): Promise<boolean> {
  if (!canUseSupabase()) {
    const existing = memoryStore.get(endpoint);
    if (!existing || storedAuthSecret(existing) !== verifiedAuth) return false;
    return memoryStore.delete(endpoint);
  }

  const { data, error } = await getSupabaseAdmin()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq(AUTH_PATH, verifiedAuth)
    .select("endpoint");

  if (error) throw new Error(error.message);
  return Array.isArray(data) && data.length > 0;
}

/** Server-internal cleanup (expired endpoints reported by the push service). */
export async function deletePushSubscription(endpoint: string): Promise<boolean> {
  if (!canUseSupabase()) {
    return memoryStore.delete(endpoint);
  }

  const { error } = await getSupabaseAdmin()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

/** Server-internal: all records for dispatch. Never exposed over HTTP. */
export async function listPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  if (!canUseSupabase()) {
    return Array.from(memoryStore.values()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  const { data, error } = await getSupabaseAdmin()
    .from("push_subscriptions")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PushSubscriptionRow[]).map(rowToRecord);
}
