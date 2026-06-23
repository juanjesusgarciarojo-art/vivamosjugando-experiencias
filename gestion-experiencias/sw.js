const CACHE_NAME = "comoiguales-dashboard-v1.0.9";
const ASSETS = [
  "./",
  "./index.html",
  "./dashboard.css?v=1.0.9",
  "./dashboard.js?v=1.0.9",
  "./icon-CI.png",
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

// Estrategia: Network First con fallback a Cache para que siempre busque las últimas actualizaciones, 
// y si está offline o falla la red cargue el App Shell desde caché.
self.addEventListener("fetch", (e) => {
  // Ignorar peticiones externas de Firebase/Firestore y APIs de autenticación
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
        // Si la red responde correctamente, cacheamos el archivo
        if (response.status === 200 && e.request.url.startsWith('http')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si no hay red, intentamos servir desde caché
        return caches.match(e.request);
      })
  );
});
