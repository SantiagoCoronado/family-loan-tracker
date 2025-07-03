/**
 * Family Loan Tracker Service Worker
 * Provides offline functionality, caching, and background sync
 */

const CACHE_NAME = 'family-loan-tracker-v1.0.0';
const DATA_CACHE_NAME = 'family-loan-data-v1.0.0';

// Files to cache for offline functionality
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://cdn.tailwindcss.com/3.4.0',
    'https://unpkg.com/react@18/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'
];

// Install event - cache core files
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Pre-caching offline page');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => {
                // Take control immediately
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all pages
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Handle data requests (future Supabase API calls)
    if (event.request.url.includes('/api/') || event.request.url.includes('supabase')) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then((cache) => {
                return fetch(event.request)
                    .then((response) => {
                        // If the response is valid, clone and store in cache
                        if (response.status === 200) {
                            cache.put(event.request.url, response.clone());
                        }
                        return response;
                    })
                    .catch(() => {
                        // Network failed, try to get from cache
                        return cache.match(event.request);
                    });
            })
        );
        return;
    }

    // Handle app shell requests
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((response) => {
                if (response) {
                    // Found in cache, return cached version
                    return response;
                }

                // Not in cache, fetch from network
                return fetch(event.request).then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response for caching
                    const responseToCache = response.clone();
                    cache.put(event.request, responseToCache);

                    return response;
                }).catch(() => {
                    // Network failed and not in cache
                    // Return offline page for navigation requests
                    if (event.request.destination === 'document') {
                        return cache.match('/');
                    }
                });
            });
        })
    );
});

// Background sync for loan data (future implementation)
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Background sync', event.tag);
    
    if (event.tag === 'loan-data-sync') {
        event.waitUntil(syncLoanData());
    }
});

// Push notifications (future implementation)
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received', event);
    
    const options = {
        body: event.data ? event.data.text() : 'Payment reminder',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'view',
                title: 'View Loans',
                icon: '/icons/icon-192.png'
            },
            {
                action: 'make-payment',
                title: 'Make Payment',
                icon: '/icons/icon-192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Family Loan Tracker', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification click received', event);
    
    event.notification.close();
    
    const action = event.action;
    
    event.waitUntil(
        clients.openWindow(action === 'make-payment' ? '/?action=payment' : '/')
    );
});

// Message handling for communication with main app
self.addEventListener('message', (event) => {
    console.log('[ServiceWorker] Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Helper function for background sync (future implementation)
async function syncLoanData() {
    try {
        // This will be implemented when we add Supabase integration
        console.log('[ServiceWorker] Syncing loan data in background');
        
        // Get pending loan data from IndexedDB
        // Sync with Supabase
        // Update local storage
        
        return Promise.resolve();
    } catch (error) {
        console.error('[ServiceWorker] Background sync failed', error);
        throw error;
    }
}

// Cache management utilities
async function clearOldCaches() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
        name.startsWith('family-loan-tracker-') && name !== CACHE_NAME
    );
    
    return Promise.all(oldCaches.map(name => caches.delete(name)));
}

// Network status handling
self.addEventListener('online', () => {
    console.log('[ServiceWorker] Back online');
    // Trigger background sync when back online
    self.registration.sync.register('loan-data-sync');
});

self.addEventListener('offline', () => {
    console.log('[ServiceWorker] Gone offline');
    // Handle offline state
});

console.log('[ServiceWorker] Service Worker loaded and ready'); 