/// <reference lib="webworker" />

const SHELL_CACHE = "disasterph-shell-v2";
const ASSET_CACHE = "disasterph-assets-v1";
const API_CACHE = "disasterph-api-v1";

const SHELL_URLS = ["/", "/manifest.json"];

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

  // Navigation — network first, fallback to cached shell
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches
          .match("/")
          .then((c) => c || new Response("Offline", { status: 503 })),
      ),
    );
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
      return cached;
    }
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
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
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.url || "disasterph-alert",
      data: { url: data.url },
      vibrate: [200, 100, 200],
      requireInteraction: true,
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
