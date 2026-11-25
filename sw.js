const prefix = 'caderno-fenix:' + self.registration.scope + '|';
const cacheName = prefix + 'a2bb3175afa8defb';
const files = ["icone-192.png", "icone-512.png", "index.html", "manifest.webmanifest"].map(path => new URL(path, self.registration.scope).href);
const home = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(files.map(url => new Request(url, {cache: 'reload', credentials: 'same-origin', redirect: 'error'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(prefix) && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  const key = url.href === self.registration.scope ? home : url.href;
  if (!files.includes(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    // A navigation reaches the host first so authentication and fresh pages still work.
    if (key === home && event.request.mode === 'navigate') {
      try { return await fetch(event.request); }
      catch (error) {
        const saved = await cache.match(home);
        if (saved) return saved;
        throw error;
      }
    }
    return (await cache.match(key)) || fetch(event.request);
  })());
});
