// Service Worker for Push Notifications
const CACHE_NAME = 'pathak-bhandar-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/offline.html'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('Error parsing push data:', error);
  }

  const title = data.title || 'Pathak Bhandar';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Order',
        icon: '/logo.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo.png'
      }
    ],
    requireInteraction: true,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'view') {
    // Open the app and navigate to orders page
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes('pathakbhandar.in') && 'focus' in client) {
            client.focus();
            // Navigate to orders page
            client.postMessage({
              type: 'NAVIGATE_TO_ORDERS',
              orderId: event.notification.data?.orderId
            });
            return;
          }
        }
        
        // Open new window if app is not open
        if (self.clients.openWindow) {
          return self.clients.openWindow('/orders');
        }
      })
    );
  }
});

// Background sync event (for offline functionality)
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'order-sync') {
    event.waitUntil(syncOrders());
  }
});

// Helper function to sync orders when back online
async function syncOrders() {
  try {
    // This would sync any pending orders when connection is restored
    console.log('Syncing orders in background');
  } catch (error) {
    console.error('Failed to sync orders:', error);
  }
}

// Handle message from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event (for caching - optional)
self.addEventListener('fetch', (event) => {
  // Simple cache-first strategy for static assets
  if (event.request.destination === 'image' || 
      event.request.destination === 'script' || 
      event.request.destination === 'style') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});