/* ═══════════════════════════════════════════════════════════
   EUREKA — sw.js (Service Worker)
   Versión: 1.0.0

   Responsabilidades:
   - Cache de archivos estáticos para funcionamiento offline
   - Estrategia: Cache First para assets, Network First para API

   IMPORTANTE: Cada vez que cambies archivos de la app,
   incrementa el número de CACHE_VERSION para que el SW
   descarte el cache viejo y descargue los archivos nuevos.
═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   VERSIÓN DEL CACHE
   Cambiar este número fuerza la actualización
   en todos los dispositivos con la app instalada.
───────────────────────────────────────── */
const CACHE_VERSION  = "eureka-v2";

/* ─────────────────────────────────────────
   ARCHIVOS A CACHEAR
   Estos se guardan en el dispositivo del usuario
   para que la app funcione sin internet.
───────────────────────────────────────── */
const ARCHIVOS_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/auth.js",
  "/manifest.json",
  "/38551-removebg-preview.png",
  "/582818991.jpg",
  "https://fonts.googleapis.com/css2?family=Geologica:slnt,wght@-12..0,100..900&family=Glory:ital,wght@0,400;0,700;0,800;1,700;1,800&family=DM+Mono:wght@400;500&display=swap"
];


/* ─────────────────────────────────────────
   EVENTO: INSTALL
   Se ejecuta cuando se instala el SW por primera vez.
   Cachea todos los archivos estáticos.
───────────────────────────────────────── */
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando versión:", CACHE_VERSION);

  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => {
        console.log("[SW] Cacheando archivos estáticos...");
        return cache.addAll(ARCHIVOS_CACHE);
      })
      .then(() => {
        console.log("[SW] Cache completado ✅");
        // Activar inmediatamente sin esperar a que se cierre la pestaña
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn("[SW] Error al cachear:", err);
      })
  );
});


/* ─────────────────────────────────────────
   EVENTO: ACTIVATE
   Se ejecuta cuando el SW toma control.
   Elimina versiones anteriores del cache.
───────────────────────────────────────── */
self.addEventListener("activate", (event) => {
  console.log("[SW] Activando versión:", CACHE_VERSION);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_VERSION)
            .map((name) => {
              console.log("[SW] Eliminando cache viejo:", name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log("[SW] Activado ✅ — tomando control de todas las pestañas");
        return self.clients.claim();
      })
  );
});


/* ─────────────────────────────────────────
   EVENTO: FETCH
   Intercepta todas las peticiones de red.

   Estrategia por tipo de recurso:
   - Archivos estáticos (HTML, CSS, JS, imágenes):
     Cache First → si no está en cache, descarga y guarda
   - Firebase / APIs externas:
     Network First → intenta red, si falla usa cache
───────────────────────────────────────── */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  /* Ignorar peticiones que no sean GET */
  if (event.request.method !== "GET") return;

  /* Ignorar extensiones de Chrome y peticiones internas */
  if (url.protocol === "chrome-extension:") return;

  /* Firebase y APIs → Network First */
  const esFirebase = url.hostname.includes("firebase") ||
                     url.hostname.includes("googleapis.com") ||
                     url.hostname.includes("firebaseio.com");

  if (esFirebase) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  /* Todo lo demás → Cache First */
  event.respondWith(cacheFirst(event.request));
});


/* ─────────────────────────────────────────
   ESTRATEGIA: CACHE FIRST
   Busca en cache → si no existe, descarga y guarda.
   Ideal para: HTML, CSS, JS, imágenes.
───────────────────────────────────────── */
async function cacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    /* Solo cachear respuestas válidas */
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }

    return response;
  } catch (err) {
    console.warn("[SW] Sin conexión y sin cache para:", request.url);
    /* Retornar página offline si existe */
    return caches.match("/index.html");
  }
}


/* ─────────────────────────────────────────
   ESTRATEGIA: NETWORK FIRST
   Intenta red → si falla, usa cache.
   Ideal para: Firebase, APIs, datos en tiempo real.
───────────────────────────────────────── */
async function networkFirst(request) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }

    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}
