// Enhanced Service Worker with Offline Support & Push Notifications
const CACHE_NAME = "safe-ride-v2.5.3";
const STATIC_CACHE = "safe-ride-static-v1";
const DYNAMIC_CACHE = "safe-ride-dynamic-v1";
const API_CACHE = "safe-ride-api-v1";

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/service-worker.js"
];

// Network first, then cache for API calls
const API_URLS = [
  "https://bsvqdfgqjcypzaafocji.supabase.co"
];

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing v2.5.3");
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[Service Worker] Caching static assets");
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn("[Service Worker] Static cache error:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(cacheName => !["safe-ride-static-v1", "safe-ride-dynamic-v1", "safe-ride-api-v1", "safe-ride-v2.5.3"].includes(cacheName))
          .map(cacheName => {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  event.waitUntil(clients.claim());
});

// Fetch event with offline support
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Handle API requests
  if (API_URLS.some(apiUrl => url.origin.includes(apiUrl))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle other requests
  event.respondWith(cacheFirstStrategy(request));
});

// Network first (try network, fallback to cache)
function networkFirstStrategy(request) {
  return fetch(request)
    .then((response) => {
      if (!response || response.status !== 200) {
        return response;
      }
      const responseClone = response.clone();
      caches.open(API_CACHE).then((cache) => {
        cache.put(request, responseClone);
      });
      return response;
    })
    .catch(() => {
      return caches.match(request).then((response) => {
        return response || createOfflineResponse();
      });
    });
}

// Cache first (try cache, fallback to network)
function cacheFirstStrategy(request) {
  return caches.match(request).then((response) => {
    if (response) {
      return response;
    }
    return fetch(request).then((response) => {
      if (!response || response.status !== 200) {
        return response;
      }
      const responseClone = response.clone();
      caches.open(DYNAMIC_CACHE).then((cache) => {
        cache.put(request, responseClone);
      });
      return response;
    });
  }).catch(() => {
    return createOfflineResponse();
  });
}

// Create offline fallback response
function createOfflineResponse() {
  return new Response(
    JSON.stringify({
      offline: true,
      message: "You are currently offline. Some features may be limited.",
      timestamp: new Date().toISOString()
    }),
    {
      status: 503,
      statusText: "Service Unavailable",
      headers: new Headers({
        "Content-Type": "application/json"
      })
    }
  );
}

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch {
    notificationData = {
      title: "SafeRide Announcement",
      body: event.data.text(),
      icon: "/safe-ride-icon.png",
    };
  }

  const options = {
    body: notificationData.body || "You have a new announcement",
    icon: notificationData.icon || "/safe-ride-icon.png",
    badge: "/safe-ride-badge.png",
    tag: "safride-notification",
    requireInteraction: false,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: notificationData.url || "/",
      ...notificationData.data,
    },
    actions: [
      {
        action: "open",
        title: "Open",
      },
      {
        action: "close",
        title: "Close",
      },
    ],
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(
        notificationData.title || "SafeRide",
        options
      ),
      playNotificationSound(),
    ])
  );
});

// Function to play notification sound
function playNotificationSound() {
  try {
    return new Promise((resolve) => {
      try {
        const audio = new Audio();
        audio.src = '/notification-chime.wav';
        audio.volume = 0.8;
        audio.onended = () => {
          console.log("[Service Worker] Notification sound finished");
          resolve();
        };
        audio.onerror = () => {
          console.warn("[Service Worker] Audio playback error, trying alternative");
          playWebAudioNotification().then(resolve);
        };
        audio.play()
          .then(() => {
            console.log("[Service Worker] Audio playing via element");
          })
          .catch((err) => {
            console.warn("[Service Worker] Audio element play failed:", err);
            playWebAudioNotification().then(resolve);
          });
      } catch (err) {
        console.warn("[Service Worker] Audio element failed:", err);
        playWebAudioNotification().then(resolve);
      }
    });
  } catch (err) {
    console.warn("[Service Worker] Sound error:", err);
    return Promise.resolve();
  }
}

// Web Audio API fallback for notification sound
function playWebAudioNotification() {
  return new Promise((resolve) => {
    try {
      const audioContext = new (typeof AudioContext !== 'undefined' ? AudioContext : typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : null)();
      
      if (!audioContext) {
        console.warn("[Service Worker] AudioContext not available");
        resolve();
        return;
      }
      
      const now = audioContext.currentTime;
      const notes = [
        { freq: 523.25, duration: 0.15, start: 0 },
        { freq: 659.25, duration: 0.15, start: 0.15 },
        { freq: 783.99, duration: 0.2, start: 0.3 },
      ];
      
      let lastEndTime = 0;
      
      notes.forEach(({ freq, duration, start }) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        const startTime = now + start;
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
        
        lastEndTime = Math.max(lastEndTime, startTime + duration);
      });
      
      setTimeout(() => {
        console.log("[Service Worker] Web Audio notification sound completed");
        resolve();
      }, (lastEndTime - now) * 1000 + 100);
    } catch (err) {
      console.warn("[Service Worker] Web Audio error:", err);
      resolve();
    }
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || "/");
      }
    })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification closed", event.notification.tag);
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background sync:", event.tag);
  if (event.tag === "sync-offline-actions") {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  try {
    const cache = await caches.open(API_CACHE);
    // Retry pending API requests
    console.log("[Service Worker] Syncing offline actions");
  } catch (error) {
    console.error("[Service Worker] Sync error:", error);
  }
}


