/// <reference lib="webworker" />

const SHELL_CACHE = "disasterph-shell-v3";
const ASSET_CACHE = "disasterph-assets-v2";
const API_CACHE = "disasterph-api-v2";

const OFFLINE_URL = "/offline.html";
const SHELL_URLS = [
  "/",
  "/pulse",
  "/shelters",
  "/manifest.json",
  "/icon.svg",
  OFFLINE_URL,
];

// Max age for cached API responses (10 minutes)
const API_MAX_AGE_MS = 10 * 60 * 1000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, ASSET_CACHE, API_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// Determine request handling strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Navigation — network first, fallback to the last cached page or app shell.
  if (event.request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }

  // Static assets (JS, CSS, fonts, images) — cache first, background revalidate
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstRevalidate(event.request, ASSET_CACHE));
    return;
  }

  // API responses — network first, fallback to cached response
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstAPI(event.request));
    return;
  }
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      (await cache.match(request)) ||
      (await cache.match("/")) ||
      (await cache.match(OFFLINE_URL)) ||
      new Response("DisasterPH is offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      })
    );
  }
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(js|css|woff2?|ttf|png|jpg|svg|ico)$/)
  );
}

// Cache-first with background revalidation for static assets
async function cacheFirstRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Start network fetch in background to update cache
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached immediately if available, otherwise wait for network
  return cached || (await fetchPromise) || new Response("", { status: 503 });
}

// Network-first for API calls, fallback to cached with timestamp header
async function networkFirstAPI(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone and store with a timestamp header
      const headers = new Headers(response.headers);
      headers.set("sw-cached-at", new Date().toISOString());
      headers.set("x-disasterph-cache-state", "fresh");
      const body = await response.clone().arrayBuffer();
      const cachedResponse = new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      await cache.put(request, cachedResponse);
    }
    return response;
  } catch {
    // Offline — try to return cached API response
    const cached = await cache.match(request);
    if (cached) {
      // Check if cached response is too old
      const cachedAt = cached.headers.get("sw-cached-at");
      if (cachedAt) {
        const age = Date.now() - new Date(cachedAt).getTime();
        if (age > API_MAX_AGE_MS) {
          // Still return stale data — better than nothing during emergencies
          // The app will label it as stale via its own cache freshness logic
        }
      }
      const headers = new Headers(cached.headers);
      headers.set("x-disasterph-cache-state", "last-known");
      return new Response(await cached.clone().arrayBuffer(), {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
    return new Response(
      JSON.stringify({
        error: "offline",
        message:
          "No cached DisasterPH data is available yet. Open the app once while online to save last-known alerts.",
      }),
      {
      status: 503,
        headers: {
          "Content-Type": "application/json",
          "x-disasterph-cache-state": "offline-empty",
        },
      },
    );
  }
}

// Push notification handler
self.addEventListener("push", (event) => {
  let data = { title: "DisasterPH Alert", body: "", url: "/" };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: data.tag || data.url || "disasterph-alert",
      data: { incidentId: data.incidentId, url: data.url },
      vibrate: [200, 100, 200],
      requireInteraction: data.severity === "critical",
    }),
  );
});

// Notification click → focus or open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus an existing tab if one is open
        for (const client of clients) {
          if (new URL(client.url).pathname === "/" && "focus" in client) {
            client.postMessage({
              type: "notification-click",
              url: targetUrl,
            });
            return client.focus();
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(targetUrl);
      }),
  );
});
