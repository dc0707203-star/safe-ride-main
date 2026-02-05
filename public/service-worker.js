// Service Worker for Web Push Notifications
const CACHE_NAME = "safe-ride-v2.5.3";

self.addEventListener("install", () => {
  console.log("[Service Worker] Installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  event.waitUntil(clients.claim());
});

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
    // Add vibration pattern for mobile devices
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

  // Play sound on push received
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
    // Try multiple approaches to ensure sound plays on mobile
    return new Promise((resolve) => {
      try {
        // Approach 1: Try using Audio element (works on some Android devices)
        const audio = new Audio();
        audio.src = '/notification-chime.wav';
        audio.volume = 0.8;
        audio.onended = () => {
          console.log("[Service Worker] Notification sound finished");
          resolve();
        };
        audio.onerror = () => {
          console.warn("[Service Worker] Audio playback error, trying alternative");
          // Try Web Audio API as fallback
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
      // Create audio context
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
      
      // Resolve after sound finishes
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
      // Check if app is already open
      for (let client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      // Open app if not already open
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || "/");
      }
    })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("[Service Worker] Notification closed", event.notification.tag);
});
