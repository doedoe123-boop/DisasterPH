import webPush from "web-push";
import type { AlertEvent } from "@/types/incident";
import { alertPassesPrefs } from "@/lib/notifications";
import {
  deletePushSubscription,
  listPushSubscriptions,
  type PushSubscriptionRecord,
} from "@/lib/push-subscription-store";

export interface PushSendResult {
  endpoint: string;
  status: "sent" | "skipped" | "failed" | "expired";
  reason?: string;
}

export interface PushDispatchResult {
  sent: number;
  skipped: number;
  failed: number;
  expired: number;
  results: PushSendResult[];
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject =
    process.env.VAPID_SUBJECT || "mailto:alerts@disaster-ph.local";

  if (!publicKey || !privateKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY.",
    );
  }

  webPush.setVapidDetails(subject, publicKey, privateKey);
}

function payloadForAlert(alert: AlertEvent) {
  return JSON.stringify({
    title: alert.incidentTitle,
    body: alert.message,
    url: `/?incident=${encodeURIComponent(alert.incidentId)}`,
    incidentId: alert.incidentId,
    region: alert.incidentRegion,
    severity: alert.incidentSeverity,
    tag: `disasterph:${alert.dedupeKey}`,
  });
}

async function sendToSubscription(
  record: PushSubscriptionRecord,
  alert: AlertEvent,
): Promise<PushSendResult> {
  if (
    !record.preferences.webPushEnabled ||
    !alertPassesPrefs(alert, record.preferences)
  ) {
    return {
      endpoint: record.endpoint,
      status: "skipped",
      reason: "preferences",
    };
  }

  try {
    await webPush.sendNotification(record.subscription, payloadForAlert(alert));
    return { endpoint: record.endpoint, status: "sent" };
  } catch (error) {
    const statusCode =
      typeof error === "object" && error !== null && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : null;

    if (statusCode === 404 || statusCode === 410) {
      await deletePushSubscription(record.endpoint);
      return {
        endpoint: record.endpoint,
        status: "expired",
        reason: `push service returned ${statusCode}`,
      };
    }

    return {
      endpoint: record.endpoint,
      status: "failed",
      reason: error instanceof Error ? error.message : "unknown push error",
    };
  }
}

export async function dispatchPushAlert(
  alert: AlertEvent,
): Promise<PushDispatchResult> {
  configureWebPush();

  const records = await listPushSubscriptions();
  const results = await Promise.all(
    records.map((record) => sendToSubscription(record, alert)),
  );

  return {
    sent: results.filter((result) => result.status === "sent").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    failed: results.filter((result) => result.status === "failed").length,
    expired: results.filter((result) => result.status === "expired").length,
    results,
  };
}
