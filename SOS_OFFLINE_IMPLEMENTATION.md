# SOS Offline Support - Quick Implementation Guide

## How It Works

When a student is **offline** and sends an SOS alert:
1. Alert is **queued locally** with timestamp and location
2. Shows confirmation: "SOS Alert Recorded - will send when online"
3. When connection **restores**, SOS automatically **syncs to admin**
4. Admin receives the SOS with original location and offline timestamp

## Integration in Student Component

```typescript
import { useOfflineSupport } from "@/hooks/useOfflineSupport";

export const Student = () => {
  const { isOnline, queueSOSAlert } = useOfflineSupport();

  const sendSOSAlert = useCallback(async () => {
    // ... get location ...
    
    const sosData = {
      student_id: studentData.id,
      trip_id: currentTrip?.id || null,
      driver_id: currentTrip?.driver_id || null,
      location_lat: latitude,
      location_lng: longitude,
      // ... other fields ...
    };

    // If offline, queue it
    if (!isOnline) {
      queueSOSAlert(sosData);
      return;
    }

    // Otherwise send normally
    await supabase.from('alerts').insert(sosData);
  }, [isOnline, queueSOSAlert]);
};
```

## Show Offline Indicator in Layout

```typescript
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useOfflineSupport } from "@/hooks/useOfflineSupport";

export const AppLayout = () => {
  const { isOnline, pendingActions, pendingSOS } = useOfflineSupport();

  return (
    <>
      <OfflineIndicator 
        isOnline={isOnline}
        pendingCount={pendingActions.length}
        pendingSOSCount={pendingSOS.length}
      />
      {/* Rest of layout */}
    </>
  );
};
```

## Data Stored

**Location**: `localStorage`
**Key**: `safe-ride-sos-queue`

**Structure**:
```json
[
  {
    "id": "sos-1707216000000-0.5",
    "type": "sos",
    "priority": "critical",
    "data": {
      "student_id": "abc123",
      "location_lat": 16.8243,
      "location_lng": 121.7622,
      "message": "Emergency SOS triggered by student"
    },
    "timestamp": 1707216000000,
    "retryCount": 0
  }
]
```

## Admin Receives with Metadata

When syncing, the admin receives:
```json
{
  "student_id": "abc123",
  "location_lat": 16.8243,
  "location_lng": 121.7622,
  "offline_sent_at": "2024-02-06T12:00:00Z",  // Original time sent offline
  "synced_at": "2024-02-06T12:05:30Z"          // Time synced to admin
}
```

## Features

✅ **Automatic Retry**: SOS retries up to 5 times before giving up
✅ **Priority Sync**: SOS syncs before other pending actions
✅ **Location Cached**: Location captured at time of SOS
✅ **Timestamps**: Both offline and online times recorded
✅ **User Feedback**: Shows status via indicator banner
✅ **No Data Loss**: Stored safely in localStorage

## Testing

### Simulate Offline SOS
1. Enable Airplane Mode or DevTools offline
2. Press SOS button
3. See: "SOS Alert Recorded - will send when online"
4. Check: `localStorage['safe-ride-sos-queue']`
5. Disable Airplane Mode
6. Watch: SOS auto-syncs to admin

## Error Handling

- **Network error**: Retries automatically
- **After 5 attempts**: Shows error toast
- **User can retry manually**: Queue persists in storage

## Browser Support

| Feature | Support |
|---------|---------|
| Offline Detection | ✅ All browsers |
| LocalStorage Queue | ✅ All browsers |
| Service Worker | ✅ All modern browsers |
| Background Sync | ✅ Chrome, Edge, Firefox |

## Notes

- SOS works **even without location** (graceful fallback)
- Synced with **auth token** for security
- Queued SOS marked as "offline" for admin reference
- Works on **mobile and desktop**
