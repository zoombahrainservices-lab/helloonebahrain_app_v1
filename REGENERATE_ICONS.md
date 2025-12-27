# How to Fix Missing App Icon in Release Build

## The Problem
After changing the icon in `app.json`, the native Android resources (mipmap folders) still contain the old icon files. This causes the icon not to show in the release build.

## Solution: Regenerate Native Resources

### Step 1: Close All Processes Using Android Folder
1. **Close Android Studio** completely
2. **Close File Explorer** if it has the `android` folder open
3. **Stop Gradle daemon** (already done):
   ```bash
   cd android
   ./gradlew --stop
   ```

### Step 2: Regenerate Native Resources
```bash
npx expo prebuild --platform android --clean
```

This will:
- Delete the `android` folder
- Regenerate it with the new icon from `app.json`
- Create all mipmap resources with your `adaptive-icon.png`

### Step 3: Rebuild Release APK
```bash
cd android
./gradlew assembleRelease
```

### Alternative: Use EAS Build
If you can't regenerate locally, use EAS Build which handles this automatically:
```bash
npx eas build --platform android --profile production
```

## Why This Happens

When you change the icon in `app.json`, Expo needs to:
1. Read the icon file (`adaptive-icon.png`)
2. Generate multiple sizes for different screen densities
3. Create foreground/background layers for adaptive icons
4. Place them in `android/app/src/main/res/mipmap-*/` folders

This only happens during `prebuild`, not during regular builds.

## Current Status

✅ `app.json` is correctly configured with `adaptive-icon.png`
❌ Native Android resources still have old icon files
⚠️ Need to regenerate resources to fix the issue

## Quick Test

After regenerating, check:
```bash
# Should see new icon files with recent timestamps
Get-ChildItem "android\app\src\main\res\mipmap-*" -Recurse -Filter "*.webp" | Select-Object FullName, LastWriteTime
```

