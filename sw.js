// قمنا بتغيير رقم الإصدار إلى v25 لإجبار الكمبيوتر والموبايل على التحديث
const CACHE_NAME = 'planner-pro-v25';
const assets = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  // تم مسح أمر التحديث الإجباري من هنا لكي يعطي المستخدم فرصة لقراءة الإشعار
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});