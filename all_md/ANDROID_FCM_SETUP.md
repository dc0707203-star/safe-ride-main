# Firebase Configuration for Android - Critical Setup

## ⚠️ CRITICAL: google-services.json is Missing!

Your Android app cannot receive push notifications without the `google-services.json` file. This file connects your Android app to your Firebase project.

## Step 1: Download google-services.json from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **saferide-f6de4**
3. Click the settings icon ⚙️ → **Project Settings**
4. Go to the **General** tab
5. Under "Your apps", find and click on your Android app (com.example.safetyride)
6. Click **google-services.json** button to download
7. Save the file

## Step 2: Add to Android Project

Place the downloaded file in:
```
android/app/google-services.json
```

The file should be in the `app/` subdirectory of the android folder, **NOT** in the `android/` root directory.

## Step 3: Ensure Android Build Configuration

Your `android/build.gradle` should already have:

```groovy
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.3.15' // or latest version
  }
}
```

And `android/app/build.gradle` should have:

```groovy
apply plugin: 'com.google.gms.google-services'
```

(This should be at the END of the file)

## Step 4: Rebuild Android App

```bash
# Clean and rebuild
npm run build
npx cap copy
npx cap sync android
npx cap open android
```

In Android Studio:
- Build → Clean Project
- Build → Rebuild Project

## Step 5: Test Notifications

1. Run the app on an Android device/emulator
2. Grant notification permissions
3. Log in as a student or driver
4. Send a test announcement from admin
5. Close the app completely
6. Check if you receive the notification

## Why This Matters

Without `google-services.json`:
- ❌ App cannot authenticate with Firebase
- ❌ FCM tokens cannot be generated
- ❌ Notifications cannot be received
- ❌ Service initialization fails silently

With `google-services.json`:
- ✅ App authenticates with Firebase
- ✅ FCM tokens are generated automatically
- ✅ Notifications delivered even when app is closed
- ✅ All background features work

## File Location

```
safe-ride-main/
├── android/
│   ├── build.gradle
│   ├── settings.gradle
│   ├── app/
│   │   ├── build.gradle
│   │   ├── google-services.json  ← PLACE THE FILE HERE
│   │   └── src/
│   └── ...
```

## If You Don't Have google-services.json

If Firebase Console doesn't show your Android app:

1. Add the app manually:
   - Go to Project Settings → Your apps
   - Click "Add app" → Select Android
   - Package name: `com.example.safetyride`
   - Debug signing certificate (optional but recommended):
     - Run: `./gradlew signingReport` in android folder
     - Copy the SHA-1 from the report
   - Download the JSON file

## Security Note

The `google-services.json` file is **safe to commit to Git** because it only contains:
- Your Firebase project ID
- API keys (restricted to Android app)
- Configuration data (not sensitive)

**DO NOT commit:**
- Firebase service account credentials (for backend only)
- Your release keystore password

## Verification

After adding the file, check:

```bash
# File should exist
ls -la android/app/google-services.json

# Build should succeed
npm run build

# Sync with Android
npx cap sync android
```

## Troubleshooting

### "google-services.json not found" error during build
**Solution**: Make sure the file is in `android/app/` directory, not `android/`

### "Failed to apply plugin" error
**Solution**: 
- Ensure `build.gradle` has `classpath 'com.google.gms:google-services:4.3.15'`
- Ensure `app/build.gradle` has `apply plugin: 'com.google.gms.google-services'` at the end

### Still not receiving notifications
**Solution**:
1. Check that FCM tokens are being stored in database
2. Verify notifications are being sent from backend
3. Check Android app logs: `adb logcat | grep -i firebase`

## Next Steps

1. ✅ Download `google-services.json` from Firebase Console
2. ✅ Place it in `android/app/google-services.json`
3. ✅ Rebuild the Android app
4. ✅ Test notifications

That's it! After this, notifications should work even with the app closed! 🎉

