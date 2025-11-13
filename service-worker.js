const CACHE_NAME = 'ticketpapa-v1';
const urlsToCache = ['/'];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/*
 * 👇 기존 fetch 리스너 대신 이 블록을 사용합니다.
 * (Stale-While-Revalidate 전략)
 */
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(event.request).then(function(response) {
        // 1. 캐시된 버전이 있으면 즉시 반환 (빠른 로딩)
        var promise = fetch(event.request).then(function(networkResponse) {
          // 2. 백그라운드에서 네트워크 요청 -> 캐시 업데이트
          // 중요: PUT/POST 등 API 요청은 캐시하지 않도록 예외 처리가 필요할 수 있습니다.
          // 지금은 모든 GET 요청을 캐시합니다.
          if (event.request.method === 'GET') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
        
        // 캐시된 응답(response)이 있으면 그것을 먼저 반환,
        // 없으면 네트워크 응답(promise)을 기다려 반환
        return response || promise;
      });
    })
  );
});
