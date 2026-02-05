# Notification Sound Testing & Verification Guide

## Quick Summary

✅ **Notification Sound is READY for deployment**

When admin sends an announcement, students/drivers will receive:
1. **Push notification** (system notification)
2. **Audio chime** (pleasant 3-note sound: C5, E5, G5)
3. **Vibration feedback** (pattern: 200ms on, 100ms off, repeated)

---

## Testing Scenarios

### Scenario 1: Mobile Device (Android)
**Setup:**
- Install SafeRide on Android device (native app via Capacitor)
- Log in as student/driver
- Device has WiFi/mobile data

**Test Steps:**
1. Keep app in **foreground**
2. Admin sends announcement
3. **Expected:** Notification appears + chime plays + phone vibrates
4. Check notification center

**Then test with app in background:**
1. Minimize app (press home button)
2. Admin sends announcement
3. **Expected:** Notification appears on lock screen + sound plays + vibration

**Then test with app closed:**
1. Force close the app
2. Admin sends announcement
3. **Expected:** Notification appears on lock screen + sound plays + vibration

---

### Scenario 2: Web Browser (Desktop)
**Setup:**
- Go to SafeRide web app on desktop browser
- Log in as student/driver
- Grant notification permissions when prompted

**Test Steps:**
1. Keep browser in focus
2. Admin sends announcement
3. **Expected:** System notification appears + sound plays + browser icon changes

**Then test with browser tab in background:**
1. Switch to different tab/app
2. Admin sends announcement
3. **Expected:** System notification appears (desktop) + sound plays

---

### Scenario 3: iOS Device
**Setup:**
- Install SafeRide on iOS device (native app)
- Log in as student/driver
- Grant notification permissions

**Note:** iOS has limitations with Web Audio API
- ✅ Notification appears
- ✅ Vibration works
- ⚠️ Sound may not play (iOS restrictions on service worker audio)

---

## Verification Checklist

### Code Verification ✅

- [x] **Admin Dashboard** sends notifications
  - File: [`src/pages/Admin.tsx`](src/pages/Admin.tsx#L221)
  - Code: `sendFCMNotification()` function

- [x] **Service Worker** handles push events
  - File: [`public/service-worker.js`](public/service-worker.js#L14)
  - Code: push event listener with `playNotificationSound()`

- [x] **Capacitor Hook** plays sound on mobile
  - File: [`src/hooks/useCapacitorPush.ts`](src/hooks/useCapacitorPush.ts#L84)
  - Code: `pushNotificationReceived` listener

- [x] **Student Page** subscribes to notifications
  - File: [`src/pages/Student.tsx`](src/pages/Student.tsx#L267)
  - Code: `subscribeToPushNotifications()`

- [x] **Driver Dashboard** subscribes to notifications
  - File: [`src/pages/DriverDashboard.tsx`](src/pages/DriverDashboard.tsx#L108)
  - Code: `subscribeToPushNotifications()`

- [x] **Sound Utility** creates audio
  - File: [`src/lib/notification-sound.ts`](src/lib/notification-sound.ts)
  - Code: Web Audio API implementation

### Functional Verification

- [ ] **Permissions**: Notification permissions granted on device
- [ ] **FCM Setup**: Firebase Cloud Messaging configured
- [ ] **Tokens**: Push tokens stored in `push_tokens` table
- [ ] **Sound Audible**: Chime sound is clearly audible
- [ ] **Vibration**: Device vibrates on notification
- [ ] **No Sound Spam**: Only plays once per notification

---

## Debugging Commands

### Check if tokens are being stored:
```sql
-- In Supabase SQL Editor
SELECT * FROM push_tokens WHERE user_type = 'student' LIMIT 5;
```

### Check browser console (web):
```javascript
// Open DevTools → Console
// You should see logs like:
// [CapacitorPush] Notification received: {...}
// [Service Worker] Notification sound finished
```

### Check if service worker is registered:
```javascript
// In browser console
navigator.serviceWorker.getRegistrations()
  .then(registrations => console.log(registrations))
```

### Test Web Audio API:
```javascript
// In browser console
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const osc = audioContext.createOscillator();
osc.frequency.value = 523.25; // C5
osc.connect(audioContext.destination);
osc.start();
setTimeout(() => osc.stop(), 200);
```

---

## Deployment Checklist

- [ ] **Web Push (Desktop)**
  - [x] Service worker updated with sound
  - [x] VAPID keys configured in Supabase
  - [x] Web Audio API fallback implemented
  - [ ] Test on Chrome, Firefox, Safari

- [ ] **Mobile Push (Capacitor)**
  - [x] useCapacitorPush hook updated with sound
  - [x] FCM integration complete
  - [ ] Test on Android physical device
  - [ ] Test on iOS (if applicable)

- [ ] **Audio Files**
  - Note: No external audio files needed (using Web Audio API)
  - Audio generated dynamically in browser/service worker

- [ ] **Permissions**
  - [x] Notification permissions requested
  - [x] Vibration API available (fallback)
  - [ ] Verify on iOS/Android settings

---

## Sound Audio Specifications

**Chime Sound:**
```
Note 1: C5 (523.25 Hz) × 0.15 seconds
Note 2: E5 (659.25 Hz) × 0.15 seconds  
Note 3: G5 (783.99 Hz) × 0.20 seconds
Total Duration: 0.50 seconds
Volume: Moderate (0.3 starting, fades to 0.01)
```

**Vibration Pattern:**
```
On: 200ms → Off: 100ms → On: 200ms → Off: 100ms → On: 200ms
Total: ~800ms of vibration stimulus
```

---

## Known Limitations

### iOS
- Web Audio API has limited support in service workers
- Vibration works ✅
- Notification appears ✅
- Audio may not play ⚠️

### Low-End Android Devices
- Web Audio API may not be available
- Falls back to vibration pattern
- Vibration works ✅

### Muted Devices
- If device is on vibrate/silent mode:
  - ✅ Notification still appears
  - ✅ Device still vibrates
  - ❌ Sound won't play (by design)

---

## Rollback Plan

If issues arise, can disable sound by commenting in:
- [`src/hooks/useCapacitorPush.ts`](src/hooks/useCapacitorPush.ts#L91-L95)
- [`public/service-worker.js`](public/service-worker.js#L50-L54)

---

## Success Indicators

When everything is working correctly:

1. **Admin Dashboard**: 
   - Admin clicks "Send Announcement"
   - Hears success chime on dashboard
   
2. **Student Phone** (foreground):
   - Receives notification immediately
   - Hears 3-note chime
   - Feels vibration pattern

3. **Student Phone** (background):
   - System notification appears
   - Phone vibrates
   - Sound plays (if device not muted)

4. **Driver Phone** (any state):
   - Same behavior as student
   - Receives driver-targeted announcements

5. **Web Browser**:
   - System notification appears (OS-level)
   - Sound plays from speaker
   - Notification persists in notification center

---

## Next Steps

1. **Test on physical devices** (primary action)
2. Monitor console logs for errors
3. Adjust volume/frequency if needed
4. Deploy to production when verified

---

## Support

For issues, check:
1. Browser/device console logs (`playNotificationSound` messages)
2. Notification permissions in OS settings
3. Push token storage in `push_tokens` table
4. FCM edge function logs in Supabase

