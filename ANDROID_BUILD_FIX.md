# Android Build Fix Guide

## Problem
Android build was failing with CMake cache corruption errors:
```
Could not read '...configure_fingerprint.bin': unrecognized RECORD_NOT_SET
```

## Solution
The issue was caused by corrupted CMake cache files. The following steps have been implemented:

### 1. Clean Script Created
A PowerShell script `clean-android-build.ps1` has been created to clean all build artifacts:

**Usage:**
```powershell
.\clean-android-build.ps1
```

This script:
- Cleans Android build directories (`android\build`, `android\.gradle`, `android\app\build`)
- Removes all corrupted CMake cache files (`.cxx` directories)
- Runs Gradle clean

### 2. Manual Clean Steps (if needed)
If the build still fails, run these commands manually:

```powershell
# Clean Android build directories
Remove-Item -Recurse -Force android\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\.gradle -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\app\build -ErrorAction SilentlyContinue

# Clean all .cxx directories (CMake cache)
Get-ChildItem -Path "android" -Recurse -Directory -Filter ".cxx" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
Get-ChildItem -Path "node_modules" -Recurse -Directory -Filter ".cxx" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force

# Run Gradle clean
cd android
.\gradlew clean
cd ..
```

### 3. Rebuild
After cleaning, rebuild the project:
```powershell
npx expo run:android
```

## Prevention
If you encounter build issues in the future:
1. Run `.\clean-android-build.ps1` first
2. Then run `npx expo run:android`

## Common Issues Fixed
- ✅ Corrupted CMake cache files
- ✅ Corrupted Gradle cache
- ✅ Build directory conflicts
- ✅ Native build artifacts corruption

## Notes
- The clean script is safe to run multiple times
- It only removes build artifacts, not source code
- First build after cleaning may take longer (normal)

























