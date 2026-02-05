import { supabase } from "@/integrations/supabase/client";

export interface NotificationSubscription {
  id?: string;
  user_id: string;
  user_type: "driver" | "student";
  subscription: PushSubscriptionJSON;
  created_at?: string;
  last_verified?: string;
}

/**
 * Register Service Worker
 */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      { scope: "/" }
    );
    console.log("Service Worker registered successfully", registration);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("Browser doesn't support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Subscribe to push notifications with VAPID
 */
export async function subscribeToPushNotifications(
  userId: string,
  userType: "driver" | "student"
): Promise<boolean> {
  try {
    console.log(`[Notifications] Starting subscription for ${userType}:`, userId);
    
    // Check permission
    if (Notification.permission !== "granted") {
      console.log("[Notifications] Requesting notification permission...");
      const granted = await requestNotificationPermission();
      if (!granted) {
        console.log("[Notifications] Permission denied");
        return false;
      }
    }

    console.log("[Notifications] Permission granted. Registering Service Worker...");
    
    // Register Service Worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error("[Notifications] Failed to register Service Worker");
      return false;
    }

    console.log("[Notifications] Service Worker registered. Getting subscription...");

    // Get existing subscription or create new one
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log("[Notifications] Creating new subscription with VAPID...");
      
      // Get VAPID public key from environment
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error("[Notifications] VAPID public key not configured in environment");
        console.log("[Notifications] Available env:", Object.keys(import.meta.env));
        return false;
      }

      console.log("[Notifications] VAPID key found. Converting...");

      // Convert base64 public key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, "+")
          .replace(/_/g, "/");
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      // Create subscription with VAPID
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      
      console.log("[Notifications] Subscription created successfully");
    } else {
      console.log("[Notifications] Using existing subscription");
    }

    if (!subscription) {
      console.error("[Notifications] Failed to create subscription");
      return false;
    }

    // Store subscription in Supabase
    const subscriptionJSON = subscription.toJSON() as PushSubscriptionJSON;

    console.log("[Notifications] Subscription JSON to store:", subscriptionJSON);
    console.log("[Notifications] Storing in DB for user:", userId, "type:", userType);

    const { data: upsertData, error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        user_type: userType,
        subscription: subscriptionJSON,
        last_verified: new Date().toISOString(),
      },
      { onConflict: "user_id,user_type" }
    );

    if (error) {
      console.error("[Notifications] Failed to store subscription:", error);
      console.error("[Notifications] Error details:", JSON.stringify(error, null, 2));
      return false;
    }

    console.log(`✓ [Notifications] Successfully subscribed ${userType} to push notifications`);
    console.log("[Notifications] Upsert response:", upsertData);
    return true;
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    return false;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(
  userId: string,
  userType: "driver" | "student"
): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
    }

    // Remove from database
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("user_type", userType);

    if (error) {
      console.error("Failed to remove subscription:", error);
      return false;
    }

    console.log("Successfully unsubscribed from push notifications");
    return true;
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error);
    return false;
  }
}

/**
 * Send push notifications to all subscribed users of a type
 */
export async function sendPushNotifications(
  userType: "driver" | "student",
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    console.log(`[Notifications] Preparing to send push for ${userType}:`, { title, body });
    console.log(`[Notifications] Supabase URL:`, import.meta.env.VITE_SUPABASE_URL);
    
    // Call edge function to send notifications
    console.log(`[Notifications] Invoking edge function: send-push-notifications`);
    
    const response = await supabase.functions.invoke(
      "send-push-notifications",
      {
        body: {
          userType,
          title,
          body,
          data,
        },
      }
    );

    console.log(`[Notifications] Edge function response:`, response);

    if (response.error) {
      console.error("[Notifications] Function returned error:", response.error);
      console.error("[Notifications] Error details:", JSON.stringify(response.error, null, 2));
      return false;
    }

    console.log("[Notifications] Function data response:", response.data);
    console.log(`✓ Push notifications sent to ${userType}s - Success!`);
    return true;
  } catch (error) {
    console.error("[Notifications] Exception in sendPushNotifications:", error);
    console.error("[Notifications] Error message:", String(error));
    if (error instanceof Error) {
      console.error("[Notifications] Stack trace:", error.stack);
    }
    return false;
  }
}

/**
 * Play notification sound for announcements
 */
export function playNotificationSound(soundType: 'announcement' | 'alert' | 'success' = 'announcement') {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;
    
    if (soundType === 'announcement') {
      // Gentle chime sound for announcements
      // Three ascending tones
      const notes = [
        { freq: 523.25, duration: 0.15 }, // C5
        { freq: 659.25, duration: 0.15 }, // E5
        { freq: 783.99, duration: 0.2 },  // G5
      ];
      
      let startTime = now;
      notes.forEach(({ freq, duration }) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
        
        startTime += duration + 0.05;
      });
    } else if (soundType === 'alert') {
      // Alert sound - two beeps
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = 800;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      
      // Second beep
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.frequency.value = 800;
      osc2.type = 'sine';
      
      gain2.gain.setValueAtTime(0.3, now + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc2.start(now + 0.3);
      osc2.stop(now + 0.5);
    } else if (soundType === 'success') {
      // Success sound - ascending tones
      const notes = [
        { freq: 392.0, duration: 0.1 }, // G4
        { freq: 523.25, duration: 0.2 }, // C5
      ];
      
      let startTime = now;
      notes.forEach(({ freq, duration }) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
        
        startTime += duration;
      });
    }
  } catch (error) {
    console.warn('[Notifications] Could not play notification sound:', error);
    // Fallback: try to use Web Audio API alternative or just skip if not available
  }
}
