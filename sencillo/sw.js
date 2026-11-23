// Sencillo: permite abrir la app sin internet. Tus datos no pasan por aquí; siguen en el teléfono.
const CACHE = 'sencillo-v1';
const BASE = [
  './', 'index.html', 'manifest.webmanifest', 'apple-touch-icon.png',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith('sencillo-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fuente = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fuente) return;

  // Páginas: primero internet (para tener siempre la última versión); sin conexión, la copia guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put('index.html', copia)); return r; })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Íconos, fuentes y demás: la copia guardada al instante y se actualiza por detrás.
  e.respondWith(
    caches.match(req, { ignoreSearch: url.origin === location.origin }).then((guardado) => {
      const red = fetch(req).then((r) => {
        if (r && (r.ok || r.type === 'opaque')) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
        return r;
      }).catch(() => guardado);
      return guardado || red;
    })
  );
});
