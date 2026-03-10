# Push Notifications Quick Start

## 🎯 What Was Fixed

Your push notification system had a critical bug: it relied on a static Firebase access token that expires every hour. **This is now fixed!**

The edge function now dynamically generates access tokens on-demand using JWT authentication, so notifications will work reliably at any time.

## ⚡ Quick Setup (5 minutes)

### Step 1: Format Your Firebase Credentials
Use the automated setup script:

```bash
chmod +x scripts/setup-firebase.sh
./scripts/setup-firebase.sh
```

The script will:
- Read your Firebase service account JSON
- Generate properly formatted environment variables
- Create `supabase/.env.local`
- Ensure credentials are git-ignored

### Step 2: Test Locally
```bash
# Start Supabase
supabase start

# Run your app
npm run dev

# Open app on Android device/emulator
# Send a test notification - it should work now!
```

### Step 3: Deploy to Production
1. Go to Supabase Dashboard
2. Project Settings → Edge Functions → Secrets
3. Add two secrets:
   - `FIREBASE_PROJECT_ID`: `saferide-f6de4`
   - `FIREBASE_SERVICE_ACCOUNT`: (your complete JSON)

## 📋 What Changed

### Files Modified:
- ✅ `/supabase/functions/send-fcm-notifications/index.ts` - Now generates tokens dynamically
- ✅ `/supabase/config.toml` - Added Firebase secret mappings

### Files Created:
- ✅ `/FCM_SETUP.md` - Complete setup guide
- ✅ `/PUSH_NOTIFICATIONS_FIX.md` - Detailed technical explanation
- ✅ `/scripts/setup-firebase.sh` - Automated setup script

## 🔑 Environment Variables Needed

**For Local Testing** (`supabase/.env.local`):
```bash
FIREBASE_PROJECT_ID=saferide-f6de4
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...your entire JSON...}'
```

**For Production** (Supabase Secrets):
Same two variables as above

## 🧪 Testing

### Test Locally
```bash
# In your app, trigger the notification (SOS alert, announcement, etc.)
# Check logs:
supabase functions logs send-fcm-notifications

# You should see success messages
```

### Test via API
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-fcm-notifications \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userType":"driver","title":"Test","body":"Hello!"}'
```

## ⚠️ Important Security Notes

1. **Never commit `.env.local`** - It's already in `.gitignore` ✓
2. **Never share the service account JSON** - Keep it private
3. **Never paste credentials in chat/email** - Use the setup script instead
4. **Regenerate credentials if exposed** - Go to Firebase Console and create new service account

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Firebase credentials not configured" | Run `./scripts/setup-firebase.sh` again |
| Notifications not received | Check if FCM tokens are in `push_tokens` table |
| App crashes on startup | Ensure `.env.local` is in `supabase/` directory, not root |
| "Invalid JWT" errors | Make sure the service account JSON is valid |

## 📚 Documentation

For detailed information, see:
- `/FCM_SETUP.md` - Complete setup guide with examples
- `/PUSH_NOTIFICATIONS_FIX.md` - Technical details about the fix

## 🚀 Next Steps

1. Run the setup script: `./scripts/setup-firebase.sh`
2. Restart Supabase: `supabase stop && supabase start`
3. Test notifications in your app
4. Deploy secrets to Supabase production
5. Enjoy working push notifications! 🎉

## Need Help?

Check the logs:
```bash
# Local development
supabase functions logs send-fcm-notifications

# Production (Supabase Dashboard)
Functions → Logs → select send-fcm-notifications
```

