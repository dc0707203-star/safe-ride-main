# Offline Splash Screen Flash Fix

## Problem
When there's no internet connection:
- App gets stuck on splash screen with infinite loading animation
- Student can't reach dashboard to send SOS offline
- Network timeout causes endless flash/loading loop

## Root Cause
`useAuth.ts` calls `supabase.auth.getSession()` without timeout
- When offline, this hangs indefinitely (no network response)
- `loading` state stays `true` forever
- Splash screen never dismisses

## Solution Implemented

### 1. **AppLayout.tsx** - Detect Offline & Skip Splash
```tsx
// New: Add online/offline detection
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  window.addEventListener('online', () => setIsOnline(true));
  window.addEventListener('offline', () => setIsOnline(false));
}, []);

// If offline → skip splash, go directly to dashboard
if (!isOnline) {
  return <>{children}</>;
}
```

**Effect**: When user opens app with no internet → goes directly to dashboard without splash

### 2. **useAuth.ts** - Add Timeout for Session Fetch
```tsx
// Check if offline first
if (!navigator.onLine) {
  setLoading(false);
  return;
}

// If online, fetch session WITH 2-second timeout
const sessionPromise = supabase.auth.getSession();
const timeoutPromise = new Promise((_, reject) => {
  timeoutId = setTimeout(() => {
    reject(new Error('Session fetch timeout'));
  }, 2000);
});

const result = await Promise.race([sessionPromise, timeoutPromise]);
```

**Effect**: Even if network is slow/unreliable, app loads dashboard after 2 seconds max

### 3. **Cleanup** - Clear Timeout on Unmount
```tsx
return () => {
  isMounted = false;
  clearTimeout(timeoutId);  // New: prevent memory leaks
  subscription.unsubscribe();
};
```

## Behavior After Fix

### No Internet (Airplane Mode / No Data)
✅ App opens **instantly** → Dashboard visible
✅ Student can tap SOS button
✅ SOS gets queued with offline timestamp
✅ No splash screen flash

### Internet Down (Connected but no signal)
✅ Waits **max 2 seconds** for session
✅ Times out gracefully
✅ Opens dashboard anyway
✅ Student can send queued SOS

### Normal (Good Internet)
✅ Splash screen shows normally (**if** session takes > 0.5s to load)
✅ Dismisses after session is loaded
✅ Student logs in, dashboard shows

## Code Changes
- `src/components/AppLayout.tsx` - Online/offline detection
- `src/hooks/useAuth.ts` - Added timeout + offline check + cleanup

## Testing
1. **Offline Test**:
   - Enable airplane mode
   - Open app
   - Dashboard should show instantly (no splash)
   - Press SOS → shows in offline queue

2. **Slow Network Test**:
   - Open DevTools → Network → 2G throttling
   - Open app
   - Dashboard shows after ~2s (splash timeout)
   - SOS still works

3. **Online Test**:
   - Good internet
   - Splash shows briefly if needed
   - Everything normal

## Files Modified
- `src/components/AppLayout.tsx` (+16 lines)
- `src/hooks/useAuth.ts` (+35 lines)

## Related Features
- Offline SOS queueing: `src/hooks/useOfflineSupport.ts`
- Student dashboard: `src/pages/Student.tsx`
- Service worker sync: `public/service-worker.js`
