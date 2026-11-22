/**
 * Outbound Web Push destinations are limited to the HTTPS endpoints of
 * browser push services. Subscription endpoints are client-supplied URLs that
 * the server later POSTs to, so anything else (internal hosts, IPs, custom
 * ports, plain HTTP) is refused both when a subscription is stored and again at
 * send time, which also covers records stored before validation existed.
 */

/** Exact hosts, or suffixes (leading ".") matched on a label boundary. */
export const ALLOWED_PUSH_HOSTS: readonly string[] = [
  "fcm.googleapis.com", // Chrome, Chromium-based browsers, Android
  "updates.push.services.mozilla.com", // Firefox
  "web.push.apple.com", // Safari (macOS, iOS/iPadOS home-screen apps)
  ".notify.windows.com", // Microsoft Edge (WNS)
];

export const MAX_PUSH_ENDPOINT_LENGTH = 2048;

function hostAllowed(hostname: string): boolean {
  return ALLOWED_PUSH_HOSTS.some((entry) =>
    entry.startsWith(".")
      ? hostname.endsWith(entry) && hostname.length > entry.length
      : hostname === entry,
  );
}

export function isAllowedPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string") return false;
  if (endpoint.length === 0 || endpoint.length > MAX_PUSH_ENDPOINT_LENGTH) {
    return false;
  }

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }

  return (
    url.protocol === "https:" &&
    url.username === "" &&
    url.password === "" &&
    (url.port === "" || url.port === "443") &&
    hostAllowed(url.hostname.toLowerCase())
  );
}
