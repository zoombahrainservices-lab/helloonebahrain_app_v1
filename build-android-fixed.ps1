Write-Host "=== Building Android App ===" -ForegroundColor Green
Write-Host "This script will clean the cache and build the app" -ForegroundColor Yellow

# Set environment variable to avoid cache issues
$env:GRADLE_USER_HOME = "$env:USERPROFILE\.gradle-clean"

# Clean everything
Write-Host "`n[1/4] Cleaning build artifacts..." -ForegroundColor Yellow
cd android
.\gradlew.bat clean --no-daemon
cd ..

# Clean Gradle cache completely
Write-Host "`n[2/4] Removing corrupted Gradle cache..." -ForegroundColor Yellow
Remove-Item -Path "$env:USERPROFILE\.gradle\caches\8.14.3\transforms" -Recurse -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Stop all Gradle daemons
Write-Host "`n[3/4] Stopping Gradle daemons..." -ForegroundColor Yellow
cd android
.\gradlew.bat --stop
cd ..

# Build using EAS which handles caching better
Write-Host "`n[4/4] Building with EAS (recommended for Play Store)..." -ForegroundColor Yellow
Write-Host "For local testing, use: npx expo run:android --device" -ForegroundColor Cyan
Write-Host "For Play Store: eas build --platform android --profile production" -ForegroundColor Cyan

# Try one more local build attempt
Write-Host "`nAttempting local build (may still fail due to cache corruption)..." -ForegroundColor Yellow
cd C:\Users\Farzeen\Desktop\HOB.V2
npx expo run:android --no-build-cache 2>&1 | Select-Object -First 50







