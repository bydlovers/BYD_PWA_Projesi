const CACHE_NAME = 'byd-ai-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/manifest.json',
    // ÖNEMLİ: Bu yolların Netlify'da var olduğundan emin olun!
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// 1. Kurulum: Dosyaları önbelleğe al
self.addEventListener('install', event => {
    // Service Worker'ın kurulana kadar beklemesini sağla
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Önbellek açıldı ve temel dosyalar eklendi.');
                // Hata 1 (script evaluation failed) genellikle buradaki bir dosyanın
                // mevcut olmamasından kaynaklanır.
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. Getirme: Önbellekten yanıtları sun
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Önbellekte varsa, önbellekten yanıt ver
                if (response) {
                    return response;
                }
                // Önbellekte yoksa, ağdan iste
                return fetch(event.request);
            })
    );
});

// 3. Aktivasyon: Eski önbellekleri temizle
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    
    // Service Worker'ın aktivasyon bitene kadar beklemesini sağla
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                // Bu kısım 76. satırınızın bulunduğu yere denk geliyor olabilir.
                cacheNames.map(cacheName => {
                    // YENİ önbellek adında olmayan tüm önbellekleri sil
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                    // Fonksiyon içinde her zaman bir şey döndürülmeli (yasal return)
                    // if bloğuna girmezse undefined döner, bu da Promise.all için uygundur.
                })
            );
        })
    );
});