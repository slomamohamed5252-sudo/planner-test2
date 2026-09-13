// ترقية الإصدار إلى v38-1 لإجبار كل الأجهزة على تحميل إصلاح مزامنة السحابة
const CACHE_NAME = 'planner-pro-v38-1';
const assets = [
  './',
  './index.html?v=38-1',
  './style.css?v=38-1',
  './script.js?v=38-1',
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
      fetch(event.request).catch(async () => {
        // بنتجاهل أي اختلاف في الـ query string (زي ?v=38-1) عند المطابقة مع الكاش،
        // لأن التطبيق لما بيتفتح من الشاشة الرئيسية (مثبت كـ PWA) بيطلب "index.html"
        // من غير أي باراميتر، وده كان بيفشل في المطابقة مع النسخة المخزنة اللي معاها ?v= فيسبب
        // "لا يمكن الوصول لهذا الموقع" لما يكون الجهاز أوفلاين.
        const cached = await caches.match(event.request, { ignoreSearch: true });
        return cached || caches.match('./index.html', { ignoreSearch: true });
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});