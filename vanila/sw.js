const CACHE_NAME = "comoiguales-experience-vanilla-v1.0.0";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./mision1.html",
  "./mision2.html",
  "./mision3.html",
  "./mision4.html",
  "./manifest.json"
];

// Instalar Service Worker y almacenar en caché el "App Shell"
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activar y limpiar cachés antiguas
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Network First con fallback a Cache para permitir juego offline si hay mala cobertura
self.addEventListener("fetch", (e) => {
  // Ignorar peticiones externas de Firebase/Firestore
  if (
    e.request.url.includes("firebase") || 
    e.request.url.includes("firestore") || 
    e.request.url.includes("googleapis")
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
