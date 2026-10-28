/* ميزانيتي | MIZANIYATI — عامل الخدمة (PWA): يعمل بدون إنترنت بعد أول زيارة */
const CACHE = 'mizan-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/styles.css',
  './assets/js/i18n.js',
  './assets/js/icons.js',
  './assets/js/util.js',
  './assets/js/data.js',
  './assets/js/vault.js',
  './assets/js/model.js',
  './assets/js/sync.js',
  './assets/js/advisor.js',
  './assets/js/views-core.js',
  './assets/js/views-finance.js',
  './assets/js/views-advisor.js',
  './assets/js/views-settings.js',
  './assets/js/app.js',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './assets/img/favicon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
/* شبكة أولاً ثم الكاش (للتحديثات)، مع رجوع للكاش عند عدم الاتصال */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
