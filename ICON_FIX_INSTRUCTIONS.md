# Fix: App Icon Not Showing - Step-by-Step Solution

## 🔴 Problem
The app icon and splash screen are not showing because the native Android resources weren't regenerated after updating `app.json`.

## ✅ Solution

### Method 1: Regenerate Native Resources (Recommended)

**Step 1: Close Everything**
1. Close **Android Studio** completely
2. Close **File Explorer** if it has the `android` folder open
3. Close any **Gradle** processes

**Step 2: Stop Gradle Daemon**
```powershell
cd android
./gradlew --stop
cd ..
```

**Step 3: Regenerate Resources**
```powershell
npx expo prebuild --platform android --clean
```

This will:
- Delete the old `android` folder
- Regenerate it with your new `adaptive-icon.png`
- Create all icon sizes for different screen densities

**Step 4: Rebuild APK**
```powershell
cd android
./gradlew assembleRelease
cd ..
```

**Step 5: Find Your APK**
```
android\app\build\outputs\apk\release\app-release.apk
```

### Method 2: Use EAS Build (Easiest)

EAS Build automatically handles icon generation:

```powershell
# Install EAS CLI (if not already installed)
npm install -g eas-cli

# Login to Expo
eas login

# Build the app
eas build --platform android --profile production
```

This will:
- Automatically generate all icon resources
- Build a signed release APK/AAB
- Handle all the native resource generation

### Method 3: Manual Workaround (If folder stays locked)

If you absolutely cannot unlock the folder:

1. **Rename the android folder temporarily**:
   ```powershell
   Rename-Item android android_backup
   ```

2. **Regenerate**:
   ```powershell
   npx expo prebuild --platform android
   ```

3. **Copy any custom changes** from `android_backup` to new `android` folder

4. **Rebuild**:
   ```powershell
   cd android
   ./gradlew assembleRelease
   ```

## 🔍 Verification

After regenerating, verify the icons were created:

```powershell
# Check icon files exist and are recent
Get-ChildItem "android\app\src\main\res\mipmap-*" -Recurse -Filter "*.webp" | Select-Object FullName, LastWriteTime | Format-Table
```

You should see:
- `ic_launcher_foreground.webp` in all mipmap folders
- Recent timestamps (just created)

## 📋 Current Configuration

Your `app.json` is correctly set:
- ✅ `icon`: `./assets/adaptive-icon.png`
- ✅ `splash.image`: `./assets/adaptive-icon.png`
- ✅ `android.adaptiveIcon.foregroundImage`: `./assets/adaptive-icon.png`
- ✅ `android.adaptiveIcon.backgroundColor`: `#dc2626`

## ⚠️ Important Notes

1. **Icon Format**: `adaptive-icon.png` should be:
   - 1024x1024 pixels
   - PNG format
   - Transparent background (for foreground layer)
   - Logo should be centered

2. **Why This Happens**: 
   - Expo generates native resources during `prebuild`
   - Changing `app.json` doesn't automatically update native resources
   - You must run `prebuild` after changing icons

3. **After Regenerating**:
   - The new APK will have your icon
   - Both app icon and splash screen will show correctly
   - Red background (#dc2626) will be applied

## 🚀 Quick Command Summary

```powershell
# Stop Gradle
cd android; ./gradlew --stop; cd ..

# Regenerate (after closing Android Studio)
npx expo prebuild --platform android --clean

# Rebuild
cd android; ./gradlew assembleRelease; cd ..

# Find APK
Get-Item "android\app\build\outputs\apk\release\app-release.apk"
```

---

**Next Steps**: Close Android Studio, then run the regeneration command above.

