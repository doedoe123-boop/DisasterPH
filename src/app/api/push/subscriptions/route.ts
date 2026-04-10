import {
  deletePushSubscription,
  listPushSubscriptions,
  upsertPushSubscription,
} from "@/lib/push-subscription-store";
import type {
  NotificationPrefs,
  StoredPushSubscription,
} from "@/lib/notifications";

interface SubscriptionPayload {
  subscription?: StoredPushSubscription;
  preferences?: NotificationPrefs;
  endpoint?: string;
}

function isSubscription(value: unknown): value is StoredPushSubscription {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as StoredPushSubscription).endpoint === "string"
  );
}

export async function GET() {
  const records = await listPushSubscriptions();
  const subscriptions = records.map((record) => ({
    endpoint: record.endpoint,
    regions: record.preferences.regions,
    minSeverity: record.preferences.minSeverity,
    webPushEnabled: record.preferences.webPushEnabled,
    updatedAt: record.updatedAt,
  }));

  return Response.json({
    data: subscriptions,
    count: subscriptions.length,
  });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as SubscriptionPayload;

  if (!isSubscription(payload.subscription) || !payload.preferences) {
    return Response.json(
      { error: "invalid_subscription", message: "Missing subscription data." },
      { status: 400 },
    );
  }

  const record = await upsertPushSubscription(
    payload.subscription,
    payload.preferences,
  );

  return Response.json({
    data: {
      endpoint: record.endpoint,
      regions: record.preferences.regions,
      minSeverity: record.preferences.minSeverity,
      webPushEnabled: record.preferences.webPushEnabled,
      updatedAt: record.updatedAt,
    },
  });
}

export async function DELETE(request: Request) {
  const payload = (await request.json()) as SubscriptionPayload;

  if (!payload.endpoint) {
    return Response.json(
      { error: "invalid_endpoint", message: "Missing subscription endpoint." },
      { status: 400 },
    );
  }

  await deletePushSubscription(payload.endpoint);

  return Response.json({ ok: true });
}
