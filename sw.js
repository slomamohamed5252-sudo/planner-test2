// ترقية الإصدار إلى v35 لإجبار كل الأجهزة على تحميل إصلاح مزامنة السحابة
const CACHE_NAME = 'planner-pro-v35';
const assets = [
  './',
  './index.html?v=35',
  './style.css?v=35',
  './script.js?v=35',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); 
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
  // متعرضش خالص لطلبات مواقع تانية غير موقعنا (زي Firebase/Firestore/Google APIs) —
  // سيبها للمتصفح يتعامل معاها طبيعي زي ما لو مفيش Service Worker خالص.
  // بدون السطر ده، الاتصال الفوري (WebChannel) بتاع Firestore بينكسر تماماً
  // لأنه محتاج اتصال شبكة مباشر ومستمر مش ممكن يعدي من خلال طبقة كاش.
  if (new URL(event.request.url).origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});