# Step-by-Step Guide: Building Release APK/AAB with Gradle

## Prerequisites

1. **Java Development Kit (JDK)**: Version 17 or higher
   - Check: `java -version`
   - Download: https://adoptium.net/

2. **Android Studio**: Latest version with Android SDK
   - Download: https://developer.android.com/studio

3. **Environment Variables**:
   ```bash
   # Set JAVA_HOME
   export JAVA_HOME=/path/to/jdk
   
   # Set ANDROID_HOME
   export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS/Linux
   export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows
   
   # Add to PATH
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

4. **Node.js and npm**: Already installed (for Expo)

---

## Step 1: Generate Production Keystore ⚠️ CRITICAL

**⚠️ IMPORTANT**: Keep this keystore file safe! You'll need it for all future updates.

### On Windows (PowerShell):
```powershell
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore helloonebahrain-release.keystore -alias helloonebahrain-key -keyalg RSA -keysize 2048 -validity 10000
```

### On macOS/Linux:
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore helloonebahrain-release.keystore -alias helloonebahrain-key -keyalg RSA -keysize 2048 -validity 10000
```

**When prompted, enter:**
- **Keystore password**: (Choose a strong password, save it!)
- **Re-enter password**: (Same password)
- **Your name**: Your name or company name
- **Organizational Unit**: (Optional)
- **Organization**: HelloOneBahrain (or your company)
- **City**: Your city
- **State**: Your state/province
- **Country code**: BH (or your country code)

**⚠️ SAVE THESE CREDENTIALS SECURELY:**
- Keystore file: `android/app/helloonebahrain-release.keystore`
- Keystore password: (the password you entered)
- Key alias: `helloonebahrain-key`
- Key password: (same as keystore password)

---

## Step 2: Configure Keystore in Gradle

### 2.1 Create `android/keystore.properties` file:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=helloonebahrain-key
storeFile=helloonebahrain-release.keystore
```

**⚠️ IMPORTANT**: Add this file to `.gitignore`:
```bash
echo "android/keystore.properties" >> .gitignore
echo "android/app/*.keystore" >> .gitignore
```

### 2.2 Update `android/app/build.gradle`:

Find the `signingConfigs` section (around line 100) and update it:

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
```

Then update the `buildTypes` section (around line 112):

```gradle
buildTypes {
    debug {
        signingConfig signingConfigs.debug
    }
    release {
        signingConfig signingConfigs.release  // Changed from debug
        def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'
        shrinkResources enableShrinkResources.toBoolean()
        minifyEnabled enableMinifyInReleaseBuilds
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        def enablePngCrunchInRelease = findProperty('android.enablePngCrunchInReleaseBuilds') ?: 'true'
        crunchPngs enablePngCrunchInRelease.toBoolean()
    }
}
```

### 2.3 Update `android/app/build.gradle` to load keystore properties:

Add at the top of the file (after the `apply plugin` lines):

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Then update `signingConfigs`:

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        if (keystoreProperties['storeFile']) {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}
```

And update `keystore.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=helloonebahrain-key
storeFile=../app/helloonebahrain-release.keystore
```

---

## Step 3: Update Version Information

### 3.1 Update `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.helloonebahrain"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1  // Increment this for each release (1, 2, 3, ...)
    versionName "1.0.0"  // Update this for each release (1.0.0, 1.0.1, ...)
    
    buildConfigField "String", "REACT_NATIVE_RELEASE_LEVEL", "\"${findProperty('reactNativeReleaseLevel') ?: 'stable'}\""
}
```

### 3.2 Update `app.json`:

```json
{
  "expo": {
    "version": "1.0.0",  // Match this with versionName
    ...
  }
}
```

---

## Step 4: Clean and Prepare Build

### 4.1 Clean previous builds:

```bash
cd android
./gradlew clean
cd ..
```

**On Windows:**
```cmd
cd android
gradlew.bat clean
cd ..
```

### 4.2 Install dependencies:

```bash
npm install
```

---

## Step 5: Build Release APK

### 5.1 Build APK (for direct installation):

```bash
cd android
./gradlew assembleRelease
```

**On Windows:**
```cmd
cd android
gradlew.bat assembleRelease
```

### 5.2 Find your APK:

The APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

**APK Size**: Typically 30-50 MB

---

## Step 6: Build Release AAB (for Google Play Store)

### 6.1 Build AAB (Android App Bundle):

```bash
cd android
./gradlew bundleRelease
```

**On Windows:**
```cmd
cd android
gradlew.bat bundleRelease
```

### 6.2 Find your AAB:

The AAB will be located at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

**AAB Size**: Typically 25-40 MB (Play Store will generate optimized APKs)

---

## Step 7: Verify the Build

### 7.1 Check APK/AAB signature:

```bash
# For APK
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk

# For AAB
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

### 7.2 Install and test APK on device:

```bash
# Connect device via USB
adb install android/app/build/outputs/apk/release/app-release.apk

# Or transfer APK to device and install manually
```

---

## Step 8: Upload to Google Play Store

1. **Go to Google Play Console**: https://play.google.com/console
2. **Create new app** (if first time) or select existing app
3. **Go to Production → Create new release**
4. **Upload AAB file**: `app-release.aab`
5. **Fill in release notes**
6. **Review and publish**

---

## Troubleshooting

### Issue: "Task :app:signRelease FAILED"
**Solution**: Check keystore.properties file exists and has correct paths

### Issue: "Keystore file not found"
**Solution**: 
- Check `storeFile` path in `keystore.properties`
- Use relative path: `../app/helloonebahrain-release.keystore`

### Issue: "Password was incorrect"
**Solution**: 
- Verify keystore password
- Check for extra spaces in `keystore.properties`

### Issue: "OutOfMemoryError"
**Solution**: Increase Gradle memory in `gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### Issue: Build takes too long
**Solution**: 
- First build always takes longer (downloads dependencies)
- Subsequent builds are faster
- Use `--no-daemon` flag if issues persist

### Issue: "SDK location not found"
**Solution**: Set ANDROID_HOME environment variable

---

## Quick Reference Commands

```bash
# Clean build
cd android && ./gradlew clean && cd ..

# Build APK
cd android && ./gradlew assembleRelease && cd ..

# Build AAB
cd android && ./gradlew bundleRelease && cd ..

# Install APK to connected device
adb install android/app/build/outputs/apk/release/app-release.apk

# Check build version
cd android && ./gradlew :app:dependencies && cd ..
```

---

## Security Best Practices

1. **Never commit keystore files to Git**
   - Already in `.gitignore`
   - Store backups securely offline

2. **Never share keystore passwords**
   - Use password manager
   - Limit access to team members

3. **Keep keystore backups**
   - Store in secure location
   - Multiple backups recommended

4. **Use different keystores for different apps**
   - Don't reuse keystores

---

## Next Steps After Building

1. ✅ Test APK/AAB on multiple devices
2. ✅ Test all features in release mode
3. ✅ Verify Google Sign-In works
4. ✅ Test checkout flow
5. ✅ Verify Supabase connection
6. ✅ Check app performance
7. ✅ Test on different Android versions
8. ✅ Upload to Play Store (internal testing first)

---

## Version Management

For future releases:

1. **Increment versionCode** in `android/app/build.gradle`:
   ```gradle
   versionCode 2  // Increment by 1
   versionName "1.0.1"  // Update as needed
   ```

2. **Update version in app.json**:
   ```json
   "version": "1.0.1"
   ```

3. **Build new release**:
   ```bash
   cd android && ./gradlew bundleRelease
   ```

---

**Build Date**: $(date)
**Last Updated**: $(date)













