# Quick Start: Build Release APK/AAB

## 🚀 Fast Track (5 Steps)

### 1. Generate Keystore
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore helloonebahrain-release.keystore -alias helloonebahrain-key -keyalg RSA -keysize 2048 -validity 10000
# Enter password when prompted (SAVE IT!)
cd ../..
```

### 2. Create keystore.properties
```bash
cd android
cp keystore.properties.example keystore.properties
# Edit keystore.properties and add your password
cd ..
```

### 3. Build APK
```bash
cd android
./gradlew assembleRelease
# Windows: gradlew.bat assembleRelease
cd ..
```

### 4. Find APK
```
android/app/build/outputs/apk/release/app-release.apk
```

### 5. Build AAB (for Play Store)
```bash
cd android
./gradlew bundleRelease
# Windows: gradlew.bat bundleRelease
cd ..
```

### Find AAB
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## ⚠️ Important Notes

1. **Keystore Password**: Save it securely! You'll need it for all future updates.
2. **Keystore File**: Keep `helloonebahrain-release.keystore` safe and backed up.
3. **First Build**: Takes 5-10 minutes (downloads dependencies).
4. **Subsequent Builds**: Much faster (2-3 minutes).

---

## 📖 Full Instructions

See `BUILD_INSTRUCTIONS.md` for detailed step-by-step guide.

---

## 🔍 Troubleshooting

**"keystore.properties not found"**
→ Create it from `keystore.properties.example`

**"Password incorrect"**
→ Check keystore.properties for typos

**"OutOfMemoryError"**
→ Increase memory in `android/gradle.properties`

**Build fails**
→ Run `./gradlew clean` first, then rebuild

---

## ✅ Pre-Build Checklist

- [ ] Keystore generated
- [ ] keystore.properties created
- [ ] Version updated in build.gradle
- [ ] Dependencies installed (`npm install`)
- [ ] Android SDK installed

---

**Ready to build?** Follow the 5 steps above! 🎉

