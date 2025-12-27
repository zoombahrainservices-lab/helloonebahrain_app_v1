# App Icon and Splash Screen Update

## Changes Applied

✅ **App Icon (Red & White Logo)**:
- Updated adaptive icon background color to **#dc2626** (red)
- This will show your white logo on red background when users see/download the app

✅ **Splash Screen**:
- Updated splash screen background to **#dc2626** (red)
- Logo will appear on red background when opening the app

## Files Updated

1. `android/app/src/main/res/values/colors.xml`
   - `iconBackground`: Changed to `#dc2626` (red)
   - `splashscreen_background`: Changed to `#dc2626` (red)

2. `app.json`
   - `android.adaptiveIcon.backgroundColor`: Changed to `#dc2626`
   - `splash.backgroundColor`: Changed to `#dc2626`

## Next Steps

To see the changes, you need to rebuild the app:

```bash
cd android
./gradlew assembleRelease
```

Or for Windows:
```bash
cd android
gradlew.bat assembleRelease
```

The new APK will have:
- **Red background with white logo** for the app icon (when downloading/installing)
- **Red background with logo** for the splash screen (when opening the app)

## Note

The logo image files (`icon.png`, `adaptive-icon.png`, `splash.png`) in the `assets` folder should contain your white logo. If you need to update these logo images, replace them in the `assets` folder and run `npx expo prebuild` (when android folder is not locked).

