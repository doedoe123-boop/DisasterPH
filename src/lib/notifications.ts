import type { AlertEvent } from "@/types/incident";

const PREFS_KEY = "disasterph-notification-prefs";
const PUSH_ENDPOINT = "/api/push/subscriptions";

export interface StoredPushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPrefs {
  /** Master toggle */
  enabled: boolean;
  /** Web Push subscription toggle for closed-tab alerts */
  webPushEnabled: boolean;
  /** Minimum severity to notify — "warning" or "critical" */
  minSeverity: "warning" | "critical";
  /** Only notify for these regions. Empty means all regions until saved-place sync fills it. */
  regions: string[];
  /** Notify on escalation triggers */
  escalations: boolean;
  /** Notify when new places are impacted */
  newPlaceImpacts: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: true,
  webPushEnabled: false,
  minSeverity: "warning",
  regions: [],
  escalations: true,
  newPlaceImpacts: true,
};

export function normalizeNotificationPrefs(
  value: Partial<NotificationPrefs>,
): NotificationPrefs {
  return {
    ...DEFAULT_PREFS,
    ...value,
    regions: Array.isArray(value.regions)
      ? value.regions.filter((region) => typeof region === "string")
      : DEFAULT_PREFS.regions,
  };
}

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return normalizeNotificationPrefs(JSON.parse(raw));
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/** Check browser support for notifications */
export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function pushSupported(): boolean {
  return (
    notificationsSupported() &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/** Current permission state */
export function getPermissionState(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

/** Request notification permission. Returns the new permission state. */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  return Notification.requestPermission();
}

/** Register the service worker. Returns the registration or null if unsupported. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }

  return output;
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export function serializePushSubscription(
  subscription: PushSubscription,
): StoredPushSubscription {
  return subscription.toJSON() as StoredPushSubscription;
}

export async function savePushSubscription(
  subscription: PushSubscription,
  prefs: NotificationPrefs,
): Promise<void> {
  await fetch(PUSH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: serializePushSubscription(subscription),
      preferences: prefs,
    }),
  });
}

export async function deletePushSubscription(
  subscription: PushSubscription,
): Promise<void> {
  await fetch(PUSH_ENDPOINT, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
    }),
  });
}

export async function subscribeToPush(
  prefs: NotificationPrefs,
): Promise<PushSubscription> {
  const vapidPublicKey = getVapidPublicKey();
  if (!vapidPublicKey) {
    throw new Error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    throw new Error("Service worker registration is unavailable.");
  }

  const permission = await requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));

  await savePushSubscription(subscription, prefs);
  return subscription;
}

export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getExistingPushSubscription();
  if (!subscription) return;

  await deletePushSubscription(subscription);
  await subscription.unsubscribe();
}

/** Check if an alert passes the user's notification preferences */
export function alertPassesPrefs(
  alert: AlertEvent,
  prefs: NotificationPrefs,
): boolean {
  if (!prefs.enabled) return false;
  if (prefs.regions.length > 0 && !prefs.regions.includes(alert.incidentRegion))
    return false;

  // Severity gate
  if (prefs.minSeverity === "critical" && alert.incidentSeverity !== "critical")
    return false;

  // Trigger-specific gates
  if (alert.trigger === "escalation" && !prefs.escalations) return false;
  if (alert.trigger === "new-place-impact" && !prefs.newPlaceImpacts)
    return false;

  return true;
}

/** Fire a browser notification for an alert event */
export function showAlertNotification(alert: AlertEvent): void {
  if (!notificationsSupported()) return;
  if (Notification.permission !== "granted") return;

  const tag = `disasterph:${alert.dedupeKey}`;
  const url = `/?incident=${encodeURIComponent(alert.incidentId)}`;

  new Notification(alert.incidentTitle, {
    body: alert.message,
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag,
    data: { incidentId: alert.incidentId, url },
    requireInteraction: alert.incidentSeverity === "critical",
  });
}
