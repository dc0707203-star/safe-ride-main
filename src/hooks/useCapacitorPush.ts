import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { playNotificationSound } from '@/lib/notification-sound';

interface PushTokenPayload {
  userId: string;
  userType: 'driver' | 'student';
  token: string;
  deviceInfo: {
    platform: string;
    timestamp: string;
  };
}

export const useCapacitorPush = (userId: string | undefined, userType: 'driver' | 'student') => {
  useEffect(() => {
    if (!userId) {
      console.log('[CapacitorPush] No user ID, skipping initialization');
      return;
    }

    const setupPushNotifications = async () => {
      try {
        // Only run on native platforms (Android, iOS)
        if (!Capacitor.isNativePlatform()) {
          console.log('[CapacitorPush] Not a native platform, skipping Capacitor setup');
          return;
        }

        console.log('[CapacitorPush] Setting up push notifications...');

        // Request permission
        const permission = await PushNotifications.requestPermissions();
        console.log('[CapacitorPush] Permission result:', permission);

        if (permission.receive === 'granted') {
          // Register for push notifications
          await PushNotifications.register();
          console.log('[CapacitorPush] Registered for push notifications');

          // Listen for token event
          PushNotifications.addListener('registration', async (token) => {
            console.log('[CapacitorPush] FCM Token received:', token.value);
            
            // Store token in database
            const payload: PushTokenPayload = {
              userId,
              userType,
              token: token.value,
              deviceInfo: {
                platform: 'android',
                timestamp: new Date().toISOString(),
              },
            };

            try {
              const { data, error } = await supabase
                .from('push_tokens')
                .upsert(
                  {
                    user_id: userId,
                    user_type: userType,
                    fcm_token: token.value,
                    device_info: payload.deviceInfo,
                    last_verified: new Date().toISOString(),
                  },
                  { onConflict: 'user_id,user_type' }
                )
                .select();

              if (error) {
                console.error('[CapacitorPush] Error storing token:', error);
                return;
              }

              console.log('[CapacitorPush] Token stored successfully:', data);
            } catch (err) {
              console.error('[CapacitorPush] Exception storing token:', err);
            }
          });

          // Listen for notification received in foreground
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[CapacitorPush] Notification received:', {
              title: notification.title,
              body: notification.body,
              data: notification.data,
            });

            // Play notification sound
            playNotificationSound('announcement');
            
            // Vibrate device
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
          });

          // Listen for notification action (tapped)
          PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('[CapacitorPush] Notification action performed:', {
              action: notification.actionId,
              inputValue: notification.inputValue,
            });

            // Handle notification tap (navigate to announcements, etc.)
          });

          // Listen for registration errors
          PushNotifications.addListener('registrationError', (error) => {
            console.error('[CapacitorPush] Registration error:', error);
          });
        } else {
          console.warn('[CapacitorPush] Notification permissions not granted');
        }
      } catch (error) {
        console.error('[CapacitorPush] Setup error:', error);
      }
    };

    setupPushNotifications();

    // Cleanup
    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [userId, userType]);
};
