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
    preferences: normalizeNotificationPrefs(row.preferences),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function upsertMemorySubscription(
  subscription: StoredPushSubscription,
  preferences: NotificationPrefs,
): PushSubscriptionRecord {
  const now = new Date().toISOString();
  const existing = memoryStore.get(subscription.endpoint);
  const record: PushSubscriptionRecord = {
    endpoint: subscription.endpoint,
    subscription,
    preferences,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  memoryStore.set(subscription.endpoint, record);
  return record;
}

export async function upsertPushSubscription(
  subscription: StoredPushSubscription,
  preferences: NotificationPrefs,
): Promise<PushSubscriptionRecord> {
  if (!canUseSupabase()) {
    return upsertMemorySubscription(subscription, preferences);
  }

  const now = new Date().toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("push_subscriptions")
    .upsert(
      {
        endpoint: subscription.endpoint,
        subscription,
        preferences,
        updated_at: now,
      },
      { onConflict: "endpoint" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToRecord(data as PushSubscriptionRow);
}

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
