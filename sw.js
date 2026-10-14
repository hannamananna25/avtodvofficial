// Service Worker — минимальный, нужен для установки PWA
const CACHE_NAME = 'avtodv-v1';
const ASSETS = ['./', './index.html', './manifest.json', './logo.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Сетевой-first для HTML, cache-first для остального — приложение всегда свежее
self.addEventListener('fetch', e => {
  const url = e.request.url;
  // CSV с Google Sheets — всегда из сети (актуальные данные)
  if (url.includes('docs.google.com') || url.includes('cbr-xml-daily.ru')) {
    return; // пропускаем, браузер сам сходит в сеть
  }
  e.respondWith(
    fetch(e.request).then(res => {
      if (e.request.method === 'GET' && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
