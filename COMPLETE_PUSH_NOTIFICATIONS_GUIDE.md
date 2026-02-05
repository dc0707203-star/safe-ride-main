# Complete Push Notifications Setup - End-to-End Guide

## 🎯 Goal: Make Notifications Work Even When App is Closed

This guide covers everything needed for push notifications to work reliably, including when the app is completely closed.

## 📋 What Needs to Happen

```
Backend (Supabase)                Device (Android)
    ↓                                    ↓
Admin sends announcement  → Firebase Cloud Messaging → App receives notification
via Edge Function                  (FCM)              even when closed
```

## 🔧 Required Setup Steps

### Step 1: Backend - Firebase Credentials ✅ DONE
**Status**: Already fixed! The edge function now generates tokens dynamically.

See: `/PUSH_NOTIFICATIONS_FIX.md`

Setup required:
```bash
./scripts/setup-firebase.sh
# Creates supabase/.env.local with Firebase credentials
```

### Step 2: Backend - Environment Variables Setup ⏳ NEEDS SETUP
**Status**: Partially done. Need to complete local and production setup.

```bash
# 1. Run the setup script
./scripts/setup-firebase.sh

# 2. Verify supabase/.env.local was created
cat supabase/.env.local

# 3. For production, add secrets to Supabase dashboard
```

### Step 3: Android App - Firebase Configuration ⚠️ CRITICAL MISSING
**Status**: `google-services.json` is missing!

This is the most important step. Without it, the app cannot communicate with Firebase.

**Steps:**
1. Download `google-services.json` from Firebase Console
2. Place in: `android/app/google-services.json`
3. Rebuild the app

See: `/ANDROID_FCM_SETUP.md` for detailed instructions

### Step 4: Database - Push Tokens Table ✅ CHECK
**Status**: Should already exist

Verify the `push_tokens` table exists:
```sql
-- Check if table exists
SELECT * FROM push_tokens LIMIT 1;

-- If it doesn't exist, create it:
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  fcm_token TEXT NOT NULL,
  device_info JSONB,
  last_verified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, user_type)
);
```

### Step 5: Frontend - Notification Permission ✅ DONE
**Status**: Already implemented in `useCapacitorPush` hook

The app:
- Requests notification permission on login
- Stores FCM token in database
- Listens for notifications in foreground

## 📝 Full Checklist

```
BACKEND SETUP:
☐ Run: ./scripts/setup-firebase.sh
☐ Verify: supabase/.env.local created
☐ Restart Supabase: supabase stop && supabase start
☐ For production: Add secrets to Supabase dashboard

ANDROID APP SETUP:
☐ Download google-services.json from Firebase Console
☐ Place in: android/app/google-services.json
☐ Run: npm run build
☐ Run: npx cap copy
☐ Run: npx cap sync android
☐ Rebuild in Android Studio (Build → Clean → Rebuild)

DATABASE:
☐ Verify push_tokens table exists
☐ Verify RLS policies allow inserts

TESTING:
☐ Install app on Android device/emulator
☐ Grant notification permission when prompted
☐ Log in as student or driver
☐ Send test announcement from admin
☐ Close app completely
☐ Verify notification appears in notification tray
☐ Tap notification to open app
```

## 🚀 Quick Start Commands

```bash
# 1. Setup Firebase credentials
chmod +x scripts/setup-firebase.sh
./scripts/setup-firebase.sh

# 2. Rebuild everything
npm run build
npx cap copy
npx cap sync android

# 3. Open Android project
npx cap open android

# 4. In Android Studio: Build → Clean Project → Rebuild Project
# Then run on device
```

## 📊 How Notifications Flow

### When Admin Sends Announcement:

```
1. Admin clicks "Send Announcement"
   ↓
2. Calls: supabase.functions.invoke('send-fcm-notifications', {...})
   ↓
3. Edge Function:
   - Generates Firebase access token from service account
   - Fetches all FCM tokens for target users from DB
   - Sends notifications via Firebase API
   ↓
4. Firebase Cloud Messaging:
   - Routes notification to each device's FCM server
   - Delivers to Android device via Google Play Services
   ↓
5. Android Device:
   - Receives notification from FCM
   - Shows in notification tray (even if app is closed!)
   - Stores locally if app not installed
   ↓
6. User taps notification:
   - App launches
   - Shows announcement
```

## 🔍 Verification Steps

### Verify Backend Setup:
```bash
# Check Supabase logs
supabase functions logs send-fcm-notifications

# Should show successful token generation and sends
```

### Verify Android Setup:
```bash
# Check Android app logs
adb logcat | grep -i "FCM\|firebase\|token"

# Should see:
# - Token registration
# - Token storage
# - Notification received
```

### Verify Database:
```sql
-- Check if device tokens are being stored
SELECT user_id, user_type, fcm_token, last_verified 
FROM push_tokens 
ORDER BY last_verified DESC 
LIMIT 5;

-- Should have recent entries after app login
```

## ⚠️ Common Issues & Solutions

### Issue 1: "firebase credentials not configured"
**Solution**: Run `./scripts/setup-firebase.sh` and restart Supabase

### Issue 2: Notifications not received even with app open
**Solution**:
- Check if `push_tokens` table has entries
- Verify FCM token is in database
- Check notification is being sent from backend
- Check Supabase logs for errors

### Issue 3: Notifications don't work when app is closed
**Solution**:
- **This is the most common issue!**
- Make sure `google-services.json` is in `android/app/`
- Rebuild the app completely
- Test on physical device (not emulator if possible)
- Check Android logs: `adb logcat | grep -i fcm`

### Issue 4: "google-services.json not found"
**Solution**: Download from Firebase Console and place in `android/app/`

### Issue 5: App crashes on startup
**Solution**:
- Check that `supabase/.env.local` is not committed to git
- Verify Firebase credentials are valid
- Check logs: `supabase functions logs send-fcm-notifications`

## 🎯 Testing Plan

### Local Testing:
```bash
# 1. Start Supabase with credentials
supabase stop && supabase start

# 2. Build and deploy app
npm run build && npx cap sync android

# 3. Test flow:
# - Open app on Android device
# - Grant notification permission
# - Log in as student/driver
# - Send test announcement from another browser
# - Close app
# - Verify notification appears
```

### Production Testing:
```bash
# Same as above, but:
# - Use production Supabase URL
# - Verify secrets are set in Supabase dashboard
# - Test with real admin account
```

## 📚 Documentation Files

- **PUSH_NOTIFICATIONS_QUICKSTART.md** - Quick 5-minute setup
- **PUSH_NOTIFICATIONS_FIX.md** - Technical details of the fix
- **FCM_SETUP.md** - Comprehensive Firebase setup guide
- **ANDROID_FCM_SETUP.md** - Android-specific setup (google-services.json)
- **scripts/setup-firebase.sh** - Automated credential setup

## 🆘 Need Help?

1. **Backend Issue?** → Check `/PUSH_NOTIFICATIONS_FIX.md`
2. **Firebase Credentials?** → Run `./scripts/setup-firebase.sh`
3. **Android Setup?** → Read `/ANDROID_FCM_SETUP.md`
4. **Notifications not received?** → Check Android logcat and Supabase logs

## ✅ Success Indicators

You'll know everything is working when:
- ✅ Admin sends announcement
- ✅ Notification appears in tray on Android device
- ✅ Works even with app completely closed
- ✅ Tapping notification opens app to announcement
- ✅ No errors in Supabase logs

## 🎉 Next Actions

1. **Immediate**: Add `google-services.json` to `android/app/`
2. **Quick**: Run `./scripts/setup-firebase.sh` to setup backend
3. **Build**: `npm run build && npx cap sync android`
4. **Test**: Install app and verify notifications work

Good luck! 🚀

