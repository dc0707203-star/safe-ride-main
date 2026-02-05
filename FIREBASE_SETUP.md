# Capacitor Push Notifications Setup Guide

This guide explains how to set up Firebase Cloud Messaging (FCM) for Android push notifications.

## What We've Done

✅ Created `useCapacitorPush` hook - Registers FCM tokens and listens for notifications
✅ Created `push_tokens` table - Stores FCM tokens by user type
✅ Created `send-fcm-notifications` Edge Function - Sends notifications via FCM API
✅ Updated DriverDashboard and Student dashboards to register tokens
✅ Updated Admin announcement system to send via FCM

## What You Need to Do

### Step 1: Create/Setup Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one for SafeRide
3. In Project Settings → Service Accounts tab:
   - Go to "Firebase Admin SDK" section
   - Click "Generate New Private Key"
   - This will download a JSON file
   - Keep this file safe - contains your credentials

### Step 2: Get Project ID

From the JSON file or Firebase console:
- **Project ID**: Can be found in the JSON file or at console.firebase.google.com

### Step 3: Generate FCM Access Token

Firebase uses OAuth 2.0. We need to create a script to generate the access token.

Option A: Use Supabase Edge Function to auto-generate (recommended):
```bash
# The Edge Function will handle token generation using the private key
# You just need to store the private key in Supabase secrets
```

Option B: Manual one-time setup:
1. Download service account key JSON from Firebase
2. Extract the private key from the JSON
3. Use Firebase's OAuth 2.0 library to generate access token
4. Store the token in `.env.local`

### Step 4: Set Environment Variables

Create or update `.env` with:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ACCESS_TOKEN=your-fcm-access-token
```

For Supabase Edge Function, set in Supabase dashboard:
- Project Settings → Edge Functions → Environment Variables
- Add `FIREBASE_PROJECT_ID` and `FIREBASE_ACCESS_TOKEN`

### Step 5: Configure Android App (Capacitor)

The `@capacitor/push-notifications` plugin needs to be configured in `capacitor.config.ts`:

```typescript
{
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
}
```

### Step 6: Update Capacitor Configuration

Ensure `android/app/build.gradle` includes:

```gradle
dependencies {
    implementation platform('com.google.firebase:firebase-bom:...')
    implementation 'com.google.firebase:firebase-messaging'
}
```

### Testing Flow

1. **User opens app** (Driver/Student):
   - `useCapacitorPush` hook initializes
   - Requests notification permission
   - Registers device and gets FCM token
   - Token stored in `push_tokens` database table

2. **Admin sends announcement**:
   - Announcement inserted into database
   - `sendFCMNotification()` called
   - Edge Function `send-fcm-notifications` invoked
   - Function fetches all FCM tokens for that user_type
   - Sends notification to each token via Firebase Cloud Messaging API

3. **Phone receives notification**:
   - Works even when app is CLOSED (Android background service)
   - Notification shows in status bar
   - Tap opens app → user sees announcement

## Helpful Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Service Accounts](https://firebase.google.com/docs/app-check/admin-sdk)
- [OAuth 2.0 for Service Accounts](https://developers.google.com/identity/protocols/oauth2/service-account)

## Files Created/Modified

- ✅ `src/hooks/useCapacitorPush.ts` - New hook for FCM registration
- ✅ `supabase/migrations/20260126052911_create_push_tokens.sql` - New tokens table
- ✅ `supabase/functions/send-fcm-notifications/index.ts` - New Edge Function for FCM
- ✅ `src/pages/DriverDashboard.tsx` - Added hook integration
- ✅ `src/pages/Student.tsx` - Added hook integration
- ✅ `src/pages/Admin.tsx` - Added `sendFCMNotification()` function

## Next Steps

1. Set up Firebase project and get credentials
2. Add FIREBASE_PROJECT_ID and FIREBASE_ACCESS_TOKEN to Supabase
3. Deploy the Edge Function: `supabase functions deploy send-fcm-notifications`
4. Build and test on Android device

## Troubleshooting

### "Firebase credentials not configured"
- Check that FIREBASE_PROJECT_ID and FIREBASE_ACCESS_TOKEN are set in Supabase

### "No FCM tokens found"
- Ensure app is installed and user opened it at least once
- Check `push_tokens` table in Supabase dashboard

### "Notification sent but didn't arrive"
- Check Android device has internet connection
- Verify app isn't battery optimized (blocking background)
- Check device notification settings for the app

### Token shows but notification doesn't come
- FCM token may be expired
- Edge Function will auto-delete expired tokens (410 response)
- Reopening app will generate new token

