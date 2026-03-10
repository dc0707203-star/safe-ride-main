# Push Notifications Bug Fix Summary

## Issue Identified

The `send-fcm-notifications` edge function was expecting a `FIREBASE_ACCESS_TOKEN` environment variable, but Firebase access tokens expire after 1 hour. This approach has several problems:

1. **Token Expiration**: Static tokens expire, causing notifications to fail after 1 hour
2. **No Regeneration**: There was no mechanism to refresh expired tokens
3. **Manual Management**: Required manually updating the token, which is impractical

## Solution Implemented

### 1. ✅ Updated `send-fcm-notifications` Edge Function

**File**: `/supabase/functions/send-fcm-notifications/index.ts`

**Changes**:
- Added dynamic Firebase OAuth 2.0 access token generation
- Uses `jose` library for JWT signing
- Generates tokens on-demand for each notification request
- Eliminates token expiration issues

**How it works**:
1. Reads `FIREBASE_SERVICE_ACCOUNT` (JSON credentials)
2. Constructs a JWT with proper claims
3. Signs JWT using the Firebase service account private key
4. Exchanges JWT for a fresh OAuth 2.0 access token
5. Uses the token to send FCM notifications
6. Token is automatically discarded after use

### 2. ✅ Updated Supabase Configuration

**File**: `/supabase/config.toml`

**Changes**:
- Added `[edge_runtime.secrets]` section
- Added `firebase_project_id` secret mapping
- Added `firebase_service_account` secret mapping

```toml
[edge_runtime.secrets]
firebase_project_id = "env(FIREBASE_PROJECT_ID)"
firebase_service_account = "env(FIREBASE_SERVICE_ACCOUNT)"
```

### 3. ✅ Created Setup Documentation

**File**: `/FCM_SETUP.md`

Comprehensive guide including:
- Security best practices
- Local development setup
- Production deployment steps
- Database schema
- Code examples
- Troubleshooting guide

### 4. ✅ Created Firebase Setup Script

**File**: `/scripts/setup-firebase.sh`

Automated script that:
- Reads your Firebase service account JSON file
- Extracts the project ID
- Formats credentials as environment variables
- Creates `supabase/.env.local` automatically
- Updates `.gitignore` to protect credentials
- Provides clear instructions

## Environment Variables Required

### For Local Development

Create `supabase/.env.local`:

```bash
FIREBASE_PROJECT_ID=saferide-f6de4
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"saferide-f6de4",...entire JSON...}'
```

### For Production

Set in Supabase Dashboard → Project Settings → Edge Functions → Secrets:
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_SERVICE_ACCOUNT`: Your complete service account JSON

## Security Improvements

✅ **No Static Tokens**: Tokens are generated on-demand, never stored  
✅ **Short-lived Tokens**: Each token is valid for only 1 hour  
✅ **Credential Isolation**: Private keys never sent to APIs, only used for JWT signing  
✅ **Environment Variable Protection**: Secrets stored in Supabase, not in code  
✅ **Automatic Rotation**: New tokens generated for each notification batch  

## Database Schema

Ensure your `push_tokens` table exists with this structure:

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

## How to Set Up

### Quick Start

```bash
# 1. Make the setup script executable
chmod +x scripts/setup-firebase.sh

# 2. Run the script
./scripts/setup-firebase.sh

# 3. Follow the prompts to set up your Firebase credentials
```

### Manual Setup

1. Get your Firebase service account JSON from Firebase Console
2. Create `supabase/.env.local`:
   ```bash
   FIREBASE_PROJECT_ID=saferide-f6de4
   FIREBASE_SERVICE_ACCOUNT='your-entire-json-as-string'
   ```
3. Ensure `.gitignore` includes `.env.local` ✓ (already configured)
4. For production, add the same variables to Supabase secrets

## Testing the Fix

### Local Testing

```bash
# Start Supabase
supabase start

# Run the app
npm run dev

# Test notification sending from your app
# The function will now properly authenticate with Firebase
```

### Production Testing

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-fcm-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "driver",
    "title": "Test",
    "body": "Testing push notifications"
  }'
```

## What Was NOT Changed

- Frontend code (Student.tsx, hooks) - already working correctly
- Database schema - already has `push_tokens` table
- Android app configuration - already has FCM setup
- `send-push-notifications` function - for web push notifications (different service)

## Next Steps

1. ✅ **Read the setup guide**: Review `/FCM_SETUP.md`
2. ✅ **Run the setup script**: `chmod +x scripts/setup-firebase.sh && ./scripts/setup-firebase.sh`
3. ✅ **Test locally**: Start Supabase and test notifications
4. ✅ **Deploy to production**: Add secrets to Supabase dashboard
5. ✅ **Monitor**: Check Supabase logs for any authentication errors

## References

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Service Account Auth](https://firebase.google.com/docs/auth/admin/start)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Jose JWT Library](https://github.com/panva/jose)

## Debugging

If notifications don't work:

1. **Check logs**: `supabase functions logs send-fcm-notifications`
2. **Verify credentials**: Run `./scripts/setup-firebase.sh` again
3. **Check database**: Ensure `push_tokens` table has entries
4. **Verify device**: Ensure FCM tokens are being stored on registration
5. **Network**: Check if Firebase API is reachable from your network

