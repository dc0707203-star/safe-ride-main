import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OfflineAction {
  id: string;
  type: 'sos' | 'alert' | 'request' | 'message';
  data: any;
  timestamp: number;
  retryCount: number;
  priority?: 'critical' | 'high' | 'normal';
}

const OFFLINE_STORAGE_KEY = 'safe-ride-offline-queue';
const SOS_STORAGE_KEY = 'safe-ride-sos-queue';

export const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [pendingSOS, setPendingSOS] = useState<OfflineAction[]>([]);

  // Detect online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[Offline Support] Online detected');
      toast.success('Back online! Syncing...', { duration: 2000 });
      // Sync SOS first (critical priority)
      syncPendingSOS().then(() => syncPendingActions());
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[Offline Support] Offline detected');
      toast.error('You are offline', { 
        description: 'SOS alerts will send when back online',
        duration: 3000 
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('[Offline Support] Service Worker registered', reg))
        .catch(err => console.error('[Offline Support] Service Worker registration failed:', err));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending actions and SOS from storage
  useEffect(() => {
    const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (stored) {
      try {
        const actions = JSON.parse(stored);
        setPendingActions(actions);
      } catch (err) {
        console.error('[Offline Support] Failed to load pending actions:', err);
      }
    }

    const storedSOS = localStorage.getItem(SOS_STORAGE_KEY);
    if (storedSOS) {
      try {
        const sos = JSON.parse(storedSOS);
        setPendingSOS(sos);
      } catch (err) {
        console.error('[Offline Support] Failed to load pending SOS:', err);
      }
    }
  }, []);

  // Queue SOS alert for offline (highest priority)
  const queueSOSAlert = useCallback((sosData: any) => {
    const action: OfflineAction = {
      id: `sos-${Date.now()}-${Math.random()}`,
      type: 'sos',
      data: sosData,
      timestamp: Date.now(),
      retryCount: 0,
      priority: 'critical',
    };

    const updated = [...pendingSOS, action];
    setPendingSOS(updated);
    localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(updated));

    console.log('[Offline Support] SOS Alert queued:', action);
    toast.success('SOS Alert Recorded', {
      description: 'Alert will be sent to admin when online',
      duration: 3000,
    });
    return action.id;
  }, [pendingSOS]);

  // Queue action for offline
  const queueAction = useCallback((
    type: 'alert' | 'request' | 'message',
    data: any
  ) => {
    const action: OfflineAction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const updated = [...pendingActions, action];
    setPendingActions(updated);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updated));

    console.log('[Offline Support] Action queued:', action);
    return action.id;
  }, [pendingActions]);

  // Sync pending SOS alerts (critical priority)
  const syncPendingSOS = useCallback(async () => {
    if (pendingSOS.length === 0) return;

    console.log('[Offline Support] Syncing', pendingSOS.length, 'pending SOS alerts');
    
    const failed: OfflineAction[] = [];

    for (const action of pendingSOS) {
      try {
        console.log('[Offline Support] Sending SOS alert:', action.id);
        
        // Send SOS to admin via Supabase
        const { error } = await supabase.from('alerts').insert({
          ...action.data,
          offline_sent_at: new Date(action.timestamp).toISOString(),
          synced_at: new Date().toISOString(),
        });

        if (error) {
          throw new Error(error.message || 'Failed to sync SOS');
        }

        console.log('[Offline Support] SOS alert synced:', action.id);
        toast.success('SOS Alert Sent to Admin', { duration: 2000 });
      } catch (error) {
        action.retryCount += 1;
        if (action.retryCount < 5) { // More retries for critical SOS
          failed.push(action);
          console.warn('[Offline Support] SOS sync failed, will retry:', action.id);
        } else {
          console.error('[Offline Support] SOS failed after retries:', action.id);
          toast.error('Failed to send SOS after multiple attempts', { duration: 4000 });
        }
      }
    }

    // Update storage with failed SOS alerts
    if (failed.length > 0) {
      localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(failed));
      setPendingSOS(failed);
    } else {
      localStorage.removeItem(SOS_STORAGE_KEY);
      setPendingSOS([]);
    }
  }, [pendingSOS]);

  // Sync pending actions when online
  const syncPendingActions = useCallback(async () => {
    if (pendingActions.length === 0) return;

    console.log('[Offline Support] Syncing', pendingActions.length, 'pending actions');
    
    const failed: OfflineAction[] = [];

    for (const action of pendingActions) {
      try {
        // Process action based on type
        if (action.type === 'alert') {
          // Sync alert
          const response = await fetch('/api/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data),
          });
          if (!response.ok) throw new Error('Failed to sync alert');
        } else if (action.type === 'message') {
          // Sync message
          const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data),
          });
          if (!response.ok) throw new Error('Failed to sync message');
        }
        
        console.log('[Offline Support] Action synced:', action.id);
      } catch (error) {
        action.retryCount += 1;
        if (action.retryCount < 3) {
          failed.push(action);
        } else {
          console.error('[Offline Support] Action failed after retries:', action.id);
          toast.error('Failed to sync action', { duration: 3000 });
        }
      }
    }

    // Update storage with failed actions
    if (failed.length > 0) {
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(failed));
      setPendingActions(failed);
    } else {
      localStorage.removeItem(OFFLINE_STORAGE_KEY);
      setPendingActions([]);
      toast.success('All changes synced!', { duration: 2000 });
    }
  }, [pendingActions]);

  // Remove action from queue
  const removeAction = useCallback((actionId: string) => {
    const updated = pendingActions.filter(a => a.id !== actionId);
    setPendingActions(updated);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updated));
  }, [pendingActions]);

  // Remove SOS from queue
  const removeSOSAction = useCallback((actionId: string) => {
    const updated = pendingSOS.filter(a => a.id !== actionId);
    setPendingSOS(updated);
    localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(updated));
  }, [pendingSOS]);

  // Get cached data
  const getCachedData = useCallback(async (key: string) => {
    try {
      const cache = await caches.open('safe-ride-api-v1');
      const response = await cache.match(key);
      return response ? await response.json() : null;
    } catch (err) {
      console.error('[Offline Support] Failed to get cached data:', err);
      return null;
    }
  }, []);

  // Store data for offline
  const storeCacheData = useCallback(async (key: string, data: any) => {
    try {
      const cache = await caches.open('safe-ride-api-v1');
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      });
      await cache.put(key, response);
      console.log('[Offline Support] Data cached:', key);
    } catch (err) {
      console.error('[Offline Support] Failed to cache data:', err);
    }
  }, []);

  return {
    isOnline,
    pendingActions,
    pendingSOS,
    queueAction,
    queueSOSAlert,
    removeAction,
    removeSOSAction,
    syncPendingActions,
    syncPendingSOS,
    getCachedData,
    storeCacheData,
  };
};

export const initializeOfflineSupport = () => {
  // Initialize IndexedDB for local data storage
  if ('indexedDB' in window) {
    const request = indexedDB.open('safe-ride-db', 1);
    
    request.onerror = () => {
      console.error('[Offline Support] IndexedDB failed');
    };
    
    request.onsuccess = () => {
      const db = request.result;
      console.log('[Offline Support] IndexedDB initialized');
      
      // Create object stores if needed
      if (!db.objectStoreNames.contains('alerts')) {
        db.createObjectStore('alerts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    };
  }

  // Request background sync permission
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      return (registration as any).sync.register('sync-offline-actions')
        .then(() => console.log('[Offline Support] Background sync registered'))
        .catch(err => console.warn('[Offline Support] Background sync not available:', err));
    });
  }
};
