import type { AlertEvent } from "@/types/incident";

const PREFS_KEY = "disasterph-notification-prefs";

export interface NotificationPrefs {
  /** Master toggle */
  enabled: boolean;
  /** Minimum severity to notify — "warning" or "critical" */
  minSeverity: "warning" | "critical";
  /** Notify on escalation triggers */
  escalations: boolean;
  /** Notify when new places are impacted */
  newPlaceImpacts: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: true,
  minSeverity: "warning",
  escalations: true,
  newPlaceImpacts: true,
};

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
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

/** Check if an alert passes the user's notification preferences */
export function alertPassesPrefs(
  alert: AlertEvent,
  prefs: NotificationPrefs,
): boolean {
  if (!prefs.enabled) return false;

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
