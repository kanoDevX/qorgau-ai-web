/* QorgauAI service worker.
 * 1. Offline emergency plan (§5.5): /golden-hour and /offline are cached with their JS/CSS so the
 *    "first hour after fraud" steps open with no connection. Everything else is network-only.
 * 2. Web Push (§4.3): show the alert, focus or open the app on click. The payload is already decrypted by
 *    the browser (RFC 8291); it never contains message text — only a region-level alert.
 * API calls (/backend, /api) are never cached: they carry personal data.
 */
const VERSION = "qorgau-v1";
const PAGES = ["/golden-hour", "/offline"];
const ASSET_RE = /\/_next\/static\/[^"'\\ )]+\.(?:js|css|woff2)/g;

async function cachePage(cache, url) {
  try {
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) return;
    await cache.put(url, res.clone());
    // Warm the page's own chunks so it renders offline on the very first visit.
    const html = await res.text();
    const assets = [...new Set(html.match(ASSET_RE) || [])];
    await Promise.all(assets.map((a) => cache.add(a).catch(() => {})));
  } catch {
    /* offline during install: the page is cached on the next successful visit */
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => Promise.all(PAGES.map((p) => cachePage(cache, p)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/backend") || url.pathname.startsWith("/api")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && PAGES.includes(url.pathname)) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(url.pathname)) || (await caches.match("/golden-hour")) || (await caches.match("/offline")) || Response.error()),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    // Content-hashed files never change: cache first.
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "QorgauAI", body: "", url: "/radar", tag: "qorgau" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* non-JSON payload: show the default title */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
