var CACHE_NAME = 'heures-v4';
var ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS).catch(function() {
                // Si une icone manque encore, ne pas bloquer l'install du cache principal.
                return Promise.all([
                    cache.add('./index.html'),
                    cache.add('./manifest.json')
                ]);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(names) {
            return Promise.all(
                names.filter(function(n) { return n !== CACHE_NAME; }).map(function(n) { return caches.delete(n); })
            );
        })
    );
    e.waitUntil(clients.claim());
    // Signaler aux pages qu'une nouvelle version est prete a etre utilisee.
    e.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(function(clientList) {
            clientList.forEach(function(client) {
                client.postMessage({ type: 'APP_UPDATED', cache: CACHE_NAME });
            });
        })
    );
});

self.addEventListener('fetch', function(e) {
    e.respondWith(
        caches.match(e.request).then(function(cached) {
            var fetched = fetch(e.request).then(function(response) {
                if (response && response.status === 200) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
                }
                return response;
            }).catch(function() { return cached; });
            return cached || fetched;
        })
    );
});
