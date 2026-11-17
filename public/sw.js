const SHELL = ["/", "/emergency", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open("bg-road-shell-v1")
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "hotspot-alert") return;
  const title = typeof data.title === "string" ? data.title : "Повишено внимание";
  const body = typeof data.body === "string" ? data.body : "";
  const tag = typeof data.tag === "string" ? data.tag : "hotspot";
  event.waitUntil(
    self.registration.showNotification(title, { body, tag, lang: "bg" })
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = typeof data.title === "string" ? data.title : "BGRN";
  const options = {
    body: typeof data.body === "string" ? data.body : "",
    tag: typeof data.tag === "string" ? data.tag : "trip",
    data: { url: typeof data.url === "string" ? data.url : "/" },
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        for (const client of windows) {
          if (!("focus" in client)) continue;
          // Open the target page (for example the border question), then show it.
          if (url !== "/" && "navigate" in client) {
            return client.navigate(url).then((moved) => (moved || client).focus());
          }
          return client.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches
          .open("bg-road-shell-v1")
          .then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached || caches.match("/emergency"))
      )
  );
});
