/* ═══════════════════════════════════════════════════════════
   EUREKA — sw.js (Service Worker)

   IMPORTANTE: Cada vez que subas cambios a la app,
   incrementa el número de CACHE_VERSION.
   Eso hace que todos los usuarios reciban la versión nueva
   automáticamente, sin necesidad de limpiar caché.

   Versión actual: eureka-v4
═══════════════════════════════════════════════════════════ */

const CACHE_VERSION = "eureka-v4";

const ARCHIVOS_CACHE = [
  "/",
  "/index.html",
  "/cadastro.html",
  "/manifest.json",
  "/38551-removebg-preview.png",
  "/582818991.jpg"
];

/* INSTALL — cachea archivos al instalar */
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando versão:", CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(ARCHIVOS_CACHE))
      .then(() => self.skipWaiting()) /* Activa inmediatamente */
      .catch(err => console.warn("[SW] Erro ao cachear:", err))
  );
});

/* ACTIVATE — elimina caches viejos */
self.addEventListener("activate", (event) => {
  console.log("[SW] Ativando versão:", CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => {
            console.log("[SW] Removendo cache antigo:", key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim()) /* Toma control inmediato de todas las pestañas */
  );
});

/* FETCH — Network First para HTML, Cache First para assets */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("chrome-extension")) return;

  const url = new URL(event.request.url);

  /* Firebase y APIs externas — siempre red */
  const esExterno = url.hostname.includes("firebase") ||
                    url.hostname.includes("googleapis.com") ||
                    url.hostname.includes("gstatic.com") ||
                    url.hostname.includes("fonts.");

  if (esExterno) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  /* HTML — Network First (garantiza versión más reciente) */
  if (event.request.headers.get("accept")?.includes("text/html") ||
      url.pathname.endsWith(".html") || url.pathname === "/") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  /* Assets (imágenes, etc.) — Cache First */
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          return response;
        })
      )
  );
});
