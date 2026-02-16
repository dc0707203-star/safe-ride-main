# Offline-First Support Guide

## Overview
The Safe Ride application now includes comprehensive offline support, allowing users to continue using key features even when internet connectivity is unavailable.

## Architecture

### 1. **Service Worker**
- **File**: `public/service-worker.js`
- **Features**:
  - Static asset caching (HTML, CSS, JS)
  - Dynamic content caching
  - API response caching
  - Network-first strategy for API calls
  - Cache-first strategy for static assets
  - Background sync for offline actions

### 2. **Progressive Web App (PWA)**
- **Manifest**: `public/manifest.json`
- **Features**:
  - Installable app experience
  - Offline-capable
  - Native app look and feel
  - Homescreen shortcuts
  - Share target API support

### 3. **Offline Detection & Management**
- **Hook**: `src/hooks/useOfflineSupport.ts`
- **Features**:
  - Real-time online/offline status detection
  - Pending action queuing
  - IndexedDB storage
  - Cache management
  - Sync capabilities

### 4. **UI Components**
- **Component**: `src/components/OfflineIndicator.tsx`
- **Features**:
  - Online/offline status indicator
  - Pending action counter
  - Auto-hide on success
  - Smooth animations

## How to Use

### 1. Initialize Offline Support
```typescript
import { initializeOfflineSupport } from '@/hooks/useOfflineSupport';

// In your App.tsx or main.tsx
initializeOfflineSupport();
```

### 2. Use the Hook in Components
```typescript
import { useOfflineSupport } from '@/hooks/useOfflineSupport';

export const MyComponent = () => {
  const {
    isOnline,
    pendingActions,
    queueAction,
    removeAction,
    syncPendingActions,
    getCachedData,
    storeCacheData,
  } = useOfflineSupport();

  const handleAction = async () => {
    if (!isOnline) {
      // Queue for later sync
      queueAction('alert', { message: 'Emergency alert' });
    } else {
      // Send immediately
      await sendAlert();
    }
  };

  return (
    <>
      {!isOnline && <p>Offline - changes will sync later</p>}
      <button onClick={handleAction}>Send Alert</button>
    </>
  );
};
```

### 3. Add Offline Indicator
```typescript
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useOfflineSupport } from '@/hooks/useOfflineSupport';

export const App = () => {
  const { isOnline, pendingActions } = useOfflineSupport();

  return (
    <>
      <OfflineIndicator isOnline={isOnline} pendingCount={pendingActions.length} />
      {/* Rest of your app */}
    </>
  );
};
```

## Caching Strategies

### Network First (API Calls)
1. Try to fetch from network
2. If successful, cache the response
3. If network fails, return cached version
4. If no cache, return offline response

### Cache First (Static Assets)
1. Try to get from cache
2. If not found, fetch from network
3. Cache new assets for next time
4. If all fail, return offline fallback

## Offline Features

### ✅ Available Offline
- View cached student/driver profiles
- View cached location history
- View cached alerts
- Read cached documents
- Access cached user settings

### ⏸️ Limited Offline (Queued)
- Send emergency alerts (queued)
- Submit messages (queued)
- Update profile (queued)
- Create new requests (queued)

### ❌ Not Available Offline
- Real-time tracking (requires live connection)
- Live notifications (partial - cached only)
- New data fetches (will use cached when offline)

## Data Storage

### 1. LocalStorage
- **Use**: Offline action queue
- **Key**: `safe-ride-offline-queue`
- **Size limit**: ~5-10MB

### 2. IndexedDB
- **Use**: Detailed offline data cache
- **Stores**:
  - `alerts`: Cached alerts
  - `cache`: General cache storage

### 3. Cache API
- **Use**: HTTP response caching
- **Stores**:
  - `safe-ride-static-v1`: Static assets
  - `safe-ride-dynamic-v1`: Dynamic content
  - `safe-ride-api-v1`: API responses

## Sync Process

When coming back online:

1. **Automatic Detection** → App detects online status
2. **Queue Check** → Service Worker checks for pending actions
3. **Sync Trigger** → Automatic sync if `SyncManager` available, else manual
4. **Retry Logic** → Retries up to 3 times with exponential backoff
5. **UI Feedback** → Shows sync progress to user
6. **Clear Queue** → Removes synced items from storage

## Implementation Checklist

- [x] Service Worker registration
- [x] PWA manifest with icons
- [x] Offline detection hook
- [x] UI indicator component
- [x] Cache strategies
- [x] IndexedDB support
- [x] Background sync support
- [ ] App icons (192x192, 512x512, maskable versions)
- [ ] Screenshots for app stores

## Generating App Icons

```bash
# Install icon generator
npm install --save-dev sharp

# Generate icons from source image
node scripts/generate-icons.js
```

## Testing Offline Mode

### Chrome DevTools
1. Open DevTools (F12)
2. Go to **Network** tab
3. Check **Offline** checkbox
4. Test app functionality

### Firefox DevTools
1. Open DevTools (F12)
2. Go to **Network** tab
3. Click throttling dropdown
4. Select **Offline**

### Actual Device
1. Enable Airplane Mode
2. Use the app
3. Come back online
4. Watch for sync notifications

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Cache API | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| PWA Install | ✅ | ✅ | ⚠️ | ✅ |
| Background Sync | ✅ | ✅ | ❌ | ✅ |

## Troubleshooting

### Service Worker not registering
- Check browser console for errors
- Verify service worker file path
- Ensure HTTPS (except localhost)

### Cache not working
- Check Storage > Cache Storage in DevTools
- Clear cache if corrupted: `caches.delete(cacheName)`
- Check cache size limits

### Offline actions not syncing
- Check pending queue in localStorage
- Verify network connection restored
- Check browser console for errors
- Try manual sync: `syncPendingActions()`

## Best Practices

1. **Always show offline status** to users
2. **Queue critical actions** (alerts, messages)
3. **Cache frequently accessed data** on app start
4. **Provide sync feedback** to user
5. **Handle sync errors gracefully**
6. **Limit offline storage** to essential data
7. **Test offline scenarios regularly**

## Performance Tips

- Keep static assets under 50MB total
- Cache only essential API responses
- Clear old cache entries regularly
- Monitor IndexedDB usage
- Use compression for stored data

## Security Considerations

1. **CSP Headers**: Already configured in index.html
2. **HTTPS Only**: Service Worker requires secure context
3. **Data Validation**: Always validate cached data
4. **User Consent**: Notify before storing large amounts
5. **Token Refresh**: Handle auth token refresh in offline mode

## Future Enhancements

- [ ] Selective offline content download
- [ ] Incremental sync (smart retry)
- [ ] Offline-first UI mode
- [ ] Data compression for storage
- [ ] P2P sync between devices
- [ ] Advanced conflict resolution
