const CACHE_NAME = "enigma-game-v1.0.0";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./operacionenigma1.html",
  "./operacionenigma2.html",
  "./operacionenigma3.html",
  "./operacionquimera.html",
  "./router-sound.mp3",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.json",
  "./imagenes/código-CRYTEX.png",
  "./imagenes/plantilla-adultos.png",
  "./imagenes/plantilla-all.png"
];

// Instalar Service Worker y cachear App Shell
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

// Estrategia: Cache First con fallback a Red para recursos locales y estáticos (imágenes, sonidos, html, css, js).
// Las peticiones de Firebase se ignoran para no interferir con la lógica en tiempo real.
self.addEventListener("fetch", (e) => {
  // Ignorar Firebase/Firestore/APIs
  if (
    e.request.url.includes("firebase") || 
    e.request.url.includes("firestore") || 
    e.request.url.includes("googleapis")
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        // Cachear nuevos recursos dinámicos locales
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
