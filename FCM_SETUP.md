# Firebase Cloud Messaging (FCM) Setup Guide

## Overview
This guide explains how to set up Firebase Cloud Messaging (FCM) push notifications for the Safe Ride application.

## Prerequisites
- Firebase project created (saferide-f6de4)
- Firebase service account credentials (JSON file)
- Supabase project configured

## Step 1: Secure Your Firebase Credentials

⚠️ **IMPORTANT**: Never commit your Firebase service account credentials to version control!

Your Firebase service account JSON should contain:
- `project_id`: saferide-f6de4
- `private_key_id`: `<redacted>`
- `private_key`: The RSA private key (keep it secret)
- `client_email`: `<service-account-email>`

## Step 2: Set Up Environment Variables

### For Local Development

Create a `.env.local` file in the root directory (DO NOT commit this file):

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=saferide-f6de4
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"<your-project-id>","private_key_id":"<redacted>",...}'
```

**Important**: The `FIREBASE_SERVICE_ACCOUNT` must be a JSON string containing the entire service account credentials.

### For Supabase Edge Functions (Local)

Create a `.env.local` file in the `supabase/` directory:

```bash
FIREBASE_PROJECT_ID=saferide-f6de4
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...entire json...}'
```

### For Supabase Edge Functions (Production)

Set these secrets in your Supabase project:

1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Add the following secrets:
   - Name: `FIREBASE_PROJECT_ID`, Value: `saferide-f6de4`
   - Name: `FIREBASE_SERVICE_ACCOUNT`, Value: `{...entire JSON service account...}`

## Step 3: Database Setup

Ensure you have the `push_tokens` table with the following structure:

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(50) NOT NULL, -- 'driver' or 'student'
  fcm_token TEXT NOT NULL,
  device_info JSONB,
  last_verified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, user_type)
);
```

## Step 4: How Push Notifications Work

### On the Frontend (Mobile App):

1. **Request Permissions**: The app requests notification permission from the user
2. **Register**: Uses Capacitor's `PushNotifications.register()`
3. **Store Token**: The FCM token is automatically stored in the `push_tokens` table

### On the Backend (Supabase Functions):

1. **Call the Function**: Invoke `send-fcm-notifications` edge function
2. **Authenticate**: The function uses your Firebase service account to get an OAuth 2.0 access token
3. **Fetch Tokens**: Retrieves all FCM tokens for the target user type from the database
4. **Send Messages**: Sends notifications via Firebase Cloud Messaging API
5. **Update Status**: Updates the `last_verified` timestamp for successful sends

## Step 5: Using Push Notifications in Code

### Sending Notifications

```typescript
import { supabase } from "@/integrations/supabase/client";

// Send notifications to all drivers
const response = await supabase.functions.invoke('send-fcm-notifications', {
  body: {
    userType: 'driver', // or 'student' or 'both'
    title: 'Alert Title',
    body: 'Alert message content',
    data: {
      // Optional custom data
      emergencyType: 'sos',
      studentId: '123'
    }
  }
});

if (response.error) {
  console.error('Failed to send notifications:', response.error);
} else {
  console.log('Notifications sent:', response.data);
}
```

## Step 6: Testing Push Notifications

### Test Locally:
1. Start Supabase locally: `supabase start`
2. Set environment variables in `supabase/.env.local`
3. Open the app on an Android device/emulator
4. Call the edge function with test data

### Test in Production:
1. Ensure secrets are set in Supabase dashboard
2. Make an HTTP POST request to your edge function:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-fcm-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "driver",
    "title": "Test Notification",
    "body": "This is a test message"
  }'
```

## Troubleshooting

### Issue: "Firebase credentials not configured"
**Solution**: Check that `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT` environment variables are set correctly.

### Issue: "Failed to generate Firebase access token"
**Solution**: 
- Verify the private key in your service account is valid
- Ensure the private key is properly escaped in the environment variable
- Check that the service account has necessary Firebase permissions

### Issue: Tokens not being stored in database
**Solution**: 
- Ensure `push_tokens` table exists
- Check Supabase RLS policies allow writes to the table
- Verify user is authenticated

### Issue: Notifications not being received on device
**Solution**:
- Ensure app has notification permissions granted
- Check device Firebase Cloud Messaging is enabled
- Verify FCM token is still valid (tokens can expire)
- Check Android app is not in deep sleep mode

## Security Best Practices

1. **Never commit credentials to Git**: Use `.env` files and Supabase secrets
2. **Rotate service accounts regularly**: Create new service accounts and disable old ones
3. **Use strong IAM policies**: Limit service account permissions to only Firebase Messaging
4. **Monitor token usage**: Track which devices/users have active tokens
5. **Implement token refresh**: Refresh tokens periodically to ensure they're valid

## References

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Capacitor Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Firebase Service Account Authentication](https://firebase.google.com/docs/auth/admin/start)
