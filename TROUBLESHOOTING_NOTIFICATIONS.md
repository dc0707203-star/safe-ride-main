# Push Notifications Troubleshooting - Real Issues

## 🔴 Current Problems Identified

### Problem 1: Supabase Docker Not Running
Your Supabase instance needs to be running for edge functions to work.

**Solution**:
```bash
cd /home/jensler/Documents/safe-ride-main
npx supabase start -d
```

Wait for it to fully start (2-3 minutes), then check status:
```bash
npx supabase status
```

### Problem 2: Firebase Credentials Not Set
✅ FIXED! We created `supabase/.env.local` with the credentials

But Supabase needs to be **restarted** to pick them up:
```bash
npx supabase stop
npx supabase start -d
```

### Problem 3: Check if FCM Tokens Are Being Stored

The app won't receive notifications if tokens aren't stored. Check with:

```bash
# Connect to Supabase database
npx supabase db pull

# Or query directly via Supabase dashboard
# Go to: Tables → push_tokens
# You should see rows with user_id and fcm_token
```

The table should have rows like:
```
id | user_id | user_type | fcm_token | last_verified | created_at
---|---------|-----------|-----------|---------------|----------
1  | user123 | student   | abc...    | 2026-01-26... | 2026-01-26...
```

## 🔧 Step-by-Step Fix

### Step 1: Ensure Docker is Running
```bash
# Check Docker status
docker ps

# If not running, start it
sudo systemctl start docker  # Linux
# or just open Docker Desktop on Mac/Windows
```

### Step 2: Start Supabase
```bash
cd /home/jensler/Documents/safe-ride-main
npx supabase stop
npx supabase start -d

# Wait 2-3 minutes, then check status
npx supabase status
```

### Step 3: Rebuild and Deploy App
```bash
npm run build
npx cap copy
npx cap sync android

# In Android Studio: Build → Clean → Rebuild
```

### Step 4: Test Notifications

**On Android Device/Emulator**:
1. Close the app completely
2. Open it fresh
3. Grant notification permission when prompted
4. Log in as student/driver
5. **Keep the app open for a moment** (let tokens sync to database)
6. Close app
7. From admin page, send announcement
8. Check notification tray

### Step 5: Check Logs

**Backend logs**:
```bash
npx supabase functions logs send-fcm-notifications
```

Look for:
- ✅ "FCM] Preparing to send notifications"
- ✅ "FCM] Generated access token"
- ✅ "FCM] Notification sent to token"

**App logs**:
```bash
# On connected Android device/emulator
adb logcat | grep -i "fcm\|notification\|token" | tail -20
```

Look for:
- ✅ "FCM Token received: abc123..."
- ✅ "Token stored successfully"

## 🚨 Most Common Issues

### Issue 1: "Firebase credentials not configured"
**Cause**: `supabase/.env.local` not created or Supabase not restarted
**Fix**: 
```bash
# Check file exists
cat supabase/.env.local

# Restart Supabase
npx supabase stop && npx supabase start -d
```

### Issue 2: No tokens in database
**Cause**: App hasn't stored tokens yet
**Fix**:
- Open app
- Grant notification permission
- Wait 5-10 seconds
- Close app
- Check database again

### Issue 3: "Cannot send messages"
**Cause**: Edge function not running/crashed
**Fix**:
- Check logs: `npx supabase functions logs send-fcm-notifications`
- Check Docker: `docker ps`
- Restart Supabase

### Issue 4: Permission errors from Google APIs
**Cause**: Service account credentials invalid
**Fix**:
- Delete `supabase/.env.local`
- Get fresh Firebase service account from Firebase Console
- Re-run setup script

## 🎯 Quick Checklist

```
Backend Setup:
☐ Docker running (docker ps shows containers)
☐ Supabase running (npx supabase status shows "Services running")
☐ supabase/.env.local exists with Firebase credentials
☐ Edge functions deployed (npx supabase functions list)

Database:
☐ push_tokens table has entries for logged-in users
☐ Entries have valid fcm_token values
☐ last_verified is recent (within last minute)

Android App:
☐ App installed and running
☐ Notification permission granted
☐ User logged in
☐ App stays open for 10+ seconds (for token sync)

Sending:
☐ Admin can invoke send-fcm-notifications function
☐ Supabase logs show successful send
☐ Device logs show notification received

Receiving:
☐ Notification appears in tray
☐ Can tap to open app
```

## 📝 Commands to Run Right Now

```bash
# 1. Ensure Docker is running
docker ps

# 2. Stop and restart Supabase
cd /home/jensler/Documents/safe-ride-main
npx supabase stop
npx supabase start -d

# 3. Wait 2-3 minutes, then check status
sleep 180
npx supabase status

# 4. Rebuild app
npm run build
npx cap copy
npx cap sync android

# 5. Check edge functions are loaded
npx supabase functions list

# 6. Check function logs (after sending notification)
npx supabase functions logs send-fcm-notifications
```

## 🆘 If Still Not Working

1. **Check Supabase is actually running**:
   ```bash
   npx supabase status
   ```
   Should show all services in green ✅

2. **Check Docker containers**:
   ```bash
   docker ps | grep supabase
   ```
   Should show 3-4 containers running

3. **Check edge function exists**:
   ```bash
   ls -la supabase/functions/send-fcm-notifications/
   ```

4. **Check .env file is readable**:
   ```bash
   cat supabase/.env.local | head -1
   ```

5. **Check app permissions on device**:
   - Settings → Apps → Safe Ride → Permissions → Notifications
   - Must be enabled

6. **Check if user has a token stored**:
   - After logging in and waiting 10 seconds
   - Query: `SELECT * FROM push_tokens WHERE user_id = 'your_id'`

