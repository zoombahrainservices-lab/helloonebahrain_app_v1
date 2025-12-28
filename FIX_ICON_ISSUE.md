# Fix: App Icon Not Showing in Release Build

## Problem
The app icon and splash screen are not showing after installing the release APK because the native Android resources weren't regenerated after changing the icon in `app.json`.

## Solution

Since the `android` folder is locked (likely by Android Studio or Gradle), we need to regenerate the native resources. Here are the steps:

### Option 1: Close Android Studio and Regenerate (Recommended)

1. **Close Android Studio** (if open)
2. **Stop Gradle daemon**:
   ```bash
   cd android
   ./gradlew --stop
   cd ..
   ```
3. **Regenerate native resources**:
   ```bash
   npx expo prebuild --platform android --clean
   ```
4. **Rebuild the APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

### Option 2: Use EAS Build (Alternative)

EAS Build automatically handles icon generation:
```bash
npx eas build --platform android
```

### Option 3: Manual Icon Update (Quick Fix)

If you can't regenerate, you can manually ensure the icon files are correct:

1. The `adaptive-icon.png` should be:
   - 1024x1024 pixels
   - PNG format
   - Transparent background (for foreground layer)
   - Or solid color (for full icon)

2. The icon is referenced in:
   - `app.json` → `android.adaptiveIcon.foregroundImage`
   - Native resources in `android/app/src/main/res/mipmap-*/`

### Current Configuration

✅ `app.json` is correctly configured:
- `icon`: `./assets/adaptive-icon.png`
- `splash.image`: `./assets/adaptive-icon.png`
- `android.adaptiveIcon.foregroundImage`: `./assets/adaptive-icon.png`
- `android.adaptiveIcon.backgroundColor`: `#dc2626`

### Verification Steps

After regenerating resources, verify:
1. Check `android/app/src/main/res/mipmap-*/ic_launcher_foreground.webp` exists
2. Check `android/app/src/main/res/mipmap-*/ic_launcher.webp` exists
3. Rebuild APK and test on device

### Why This Happens

Expo generates native Android resources (mipmap folders) from `app.json` during `prebuild`. When you change the icon in `app.json` but don't regenerate, the old icon files remain in the native resources, causing the icon not to show.













