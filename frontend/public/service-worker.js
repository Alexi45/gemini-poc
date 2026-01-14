/**
 * Service Worker para modo offline
 * Proporciona funcionalidad offline con sincronización automática
 */

const CACHE_NAME = 'gemini-chat-v1';
const OFFLINE_URL = '/offline.html';

// Recursos para cachear
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/styles.css',
  '/offline.html'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static resources');
      return cache.addAll(STATIC_RESOURCES);
    })
  );
  
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachear peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  // Estrategia: Network First, fallback to Cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clonar la respuesta para guardar en cache
          const responseClone = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          
          return response;
        })
        .catch(() => {
          // Si falla, intentar desde cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Si no hay cache, retornar respuesta offline
            return new Response(
              JSON.stringify({
                success: false,
                offline: true,
                message: 'Sin conexión a internet'
              }),
              {
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Para recursos estáticos: Cache First, fallback to Network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request).then((response) => {
        // Guardar en cache si es exitoso
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        
        return response;
      });
    }).catch(() => {
      // Fallback para páginas HTML
      if (request.headers.get('accept').includes('text/html')) {
        return caches.match(OFFLINE_URL);
      }
    })
  );
});

// Sincronización en background
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncPendingMessages());
  }
});

// Función para sincronizar mensajes pendientes
async function syncPendingMessages() {
  try {
    // Obtener mensajes pendientes del IndexedDB
    const db = await openDatabase();
    const pendingMessages = await getPendingMessages(db);
    
    if (pendingMessages.length === 0) {
      console.log('[SW] No pending messages to sync');
      return;
    }
    
    console.log(`[SW] Syncing ${pendingMessages.length} pending messages`);
    
    // Enviar cada mensaje
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${message.token}`
          },
          body: JSON.stringify({
            message: message.text,
            conversationId: message.conversationId
          })
        });
        
        if (response.ok) {
          // Marcar como sincronizado
          await markMessageAsSynced(db, message.id);
          console.log('[SW] Message synced:', message.id);
        }
      } catch (error) {
        console.error('[SW] Error syncing message:', error);
      }
    }
    
    // Notificar al cliente
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        count: pendingMessages.length
      });
    });
    
  } catch (error) {
    console.error('[SW] Sync error:', error);
  }
}

// Utilidades para IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GeminiChatDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingMessages(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingMessages'], 'readonly');
    const store = transaction.objectStore('pendingMessages');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function markMessageAsSynced(db, messageId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingMessages'], 'readwrite');
    const store = transaction.objectStore('pendingMessages');
    const request = store.delete(messageId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Mensaje al cliente cuando se instala/actualiza
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded');
