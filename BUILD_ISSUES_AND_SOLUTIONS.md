# Build Issues and Solutions

## Issue 1: Gradle Cache Corruption

### Problem
The Gradle cache is getting corrupted during builds, causing errors like:
- `Corrupted DataBlock found in cache`
- `Could not read workspace metadata from C:\Users\Farzeen\.gradle\caches\8.14.3\transforms\...\metadata.bin`

### Root Cause
This is typically caused by:
1. **Antivirus software** interfering with Gradle cache writes
2. **Disk issues** or file system corruption
3. **Multiple processes** trying to write to the cache simultaneously
4. **Incomplete shutdowns** of previous builds

### Solutions

#### Quick Fix (Run before each build):
```powershell
.\fix-gradle-cache.ps1
```

Or manually:
```powershell
cd android
.\gradlew.bat --stop
Remove-Item -Path "$env:USERPROFILE\.gradle\caches\8.14.3\transforms" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.gradle\caches\journal-1" -Recurse -Force -ErrorAction SilentlyContinue
```

#### Permanent Fixes:

1. **Add Gradle cache to antivirus exclusions:**
   - Add `C:\Users\Farzeen\.gradle` to your antivirus exclusion list
   - This prevents antivirus from scanning/corrupting cache files during writes

2. **Disable build cache** (already done in `gradle.properties`):
   - `org.gradle.caching=false` is set

3. **Use --no-build-cache flag:**
   ```powershell
   npx expo run:android --no-build-cache
   ```

4. **Check disk health:**
   - Run `chkdsk C: /f` to check for disk errors
   - Ensure you have enough free disk space

## Issue 2: Google Play Store First Submission

### Problem
When trying to submit via `eas submit --platform android`, you get:
```
✖ Something went wrong when submitting your app to Google Play Store.
You haven't submitted this app to Google Play Store yet. The first submission of the app needs to be performed manually.
```

### Explanation
**This is NOT an error - it's a Google Play Store requirement!**

Google Play Store requires that the **first submission** of any app must be done **manually** through the Google Play Console web interface. This is a security measure to prevent automated spam submissions.

### Solution

1. **Build your app for release:**
   ```powershell
   eas build --platform android --profile production
   ```

2. **Download the AAB file** from the EAS build page

3. **Manually upload to Google Play Console:**
   - Go to https://play.google.com/console
   - Create a new app (if you haven't already)
   - Go to "Production" → "Create new release"
   - Upload the AAB file manually
   - Fill in release notes and other required information
   - Submit for review

4. **After the first submission:**
   - Once your app is approved and published for the first time
   - You can use `eas submit` for all future submissions
   - EAS will automatically handle subsequent releases

### Why This Happens
- Google Play Store needs to verify the app owner's identity
- First submission requires manual review of app metadata
- Prevents automated abuse of the Play Store
- After first approval, automated submissions are allowed

## Next Steps

1. **Fix Gradle cache issue:**
   - Run `.\fix-gradle-cache.ps1` before building
   - Add `.gradle` folder to antivirus exclusions
   - Try building again: `npx expo run:android`

2. **For Play Store submission:**
   - Build release version: `eas build --platform android --profile production`
   - Manually upload first release via Google Play Console
   - Use `eas submit` for future releases








