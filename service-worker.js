// service-worker.js

const CACHE_NAME = 'byd-destek-cache-v34';
const DYNAMIC_CACHE_NAME = 'byd-destek-dynamic-v34'; 

// Uygulamanın çevrimdışı çalışması için gerekli tüm statik dosyalar
const urlsToCache = [
    './', 
    'index.html',
    'style.css',
    'script.js',
    'data.json', 
    'photo/destek.jpg', 
    'manifest.json', 
    'favicon/favicon.ico',
    'favicon/apple-touch-icon.png',
    'favicon/android-chrome-192x192.png',
    'favicon/android-chrome-512x512.png',
    'favicon/maskable_icon_x512.png'
];


// 1. KURULUM (INSTALL): Service Worker yüklendiğinde statik dosyaları önbelleğe alır.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Önbellek (Cache) başarıyla açıldı, statik dosyalar ekleniyor.');
                
                // Önbelleğe alma hatalarını yok sayar
                const promises = urlsToCache.map(url => {
                    return cache.add(url).catch(error => {
                        console.warn(`UYARI: ${url} önbelleğe alınamadı, devam ediliyor.`, error);
                        return Promise.resolve();
                    });
                });
                
                return Promise.all(promises);
            })
            .then(() => {
                // Kurulum bitti, hemen aktif hale geç
                return self.skipWaiting(); 
            })
            .catch(err => {
                console.error('Genel Önbelleğe alma hatası:', err);
            })
    );
});

// 2. AKTİVASYON (ACTIVATE): Yeni bir Service Worker yüklendiğinde eski önbellekleri temizler.
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Mevcut sürüm olmayan tüm önbellekleri sil
                    if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                        console.log('Eski önbellek temizleniyor:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});


// 3. GETİRME (FETCH): Her ağ isteğini yakalar ve önbellekten yanıt döner.
self.addEventListener('fetch', event => {
    
    // Sadece GET isteklerini ve http/https protokollerini işle
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    // data.json isteği için her zaman ağdan çekmeyi dene, sonra önbelleğe bak (Stale-While-Revalidate benzeri)
    if (event.request.url.includes('data.json')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return; 
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Önbellekte eşleşme varsa, hemen önbellekten dön
            if (cachedResponse) {
                return cachedResponse;
            }

            // Önbellekte yoksa, ağdan çek ve dinamik önbelleğe ekle
            return fetch(event.request).then(response => {
                // Geçersiz yanıtları önbelleğe alma
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Yanıtı klonla (çünkü yanıt sadece bir kez okunabilir)
                const responseToCache = response.clone();

                caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        }).catch(() => {
            // Ağda ve önbellekte yoksa (örneğin çevrimdışı PDF'ler için)
            console.log("Ağ ve Önbellek hatası. Yedek yanıt yok.");
        })
    ); // <-- EKSİK OLAN İLK PARANTEZ BURADA TAMAMLANDI!
}); // <-- EKSİK OLAN İKİNCİ PARANTEZ VE NOKTALI VİRGÜL BURADA TAMAMLANDI!