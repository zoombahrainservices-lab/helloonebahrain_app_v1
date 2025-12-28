Write-Host "=== Cleaning and Building Android App ===" -ForegroundColor Green

# Step 1: Stop all Gradle daemons
Write-Host "`n[1/5] Stopping Gradle daemons..." -ForegroundColor Yellow
cd android
.\gradlew.bat --stop 2>&1 | Out-Null
cd ..

# Step 2: Kill any Java processes
Write-Host "[2/5] Killing Java processes..." -ForegroundColor Yellow
Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 3: Remove corrupted transform cache
Write-Host "[3/5] Removing corrupted transform cache..." -ForegroundColor Yellow
$transformCache = "$env:USERPROFILE\.gradle\caches\8.14.3\transforms"
$transformCache3 = "$env:USERPROFILE\.gradle\caches\transforms-3"

if (Test-Path $transformCache) {
    Remove-Item -Path $transformCache -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  Removed: $transformCache" -ForegroundColor Green
}

if (Test-Path $transformCache3) {
    Remove-Item -Path $transformCache3 -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  Removed: $transformCache3" -ForegroundColor Green
}

# Step 4: Clean Android build
Write-Host "[4/5] Cleaning Android build..." -ForegroundColor Yellow
cd android
.\gradlew.bat clean --no-daemon 2>&1 | Out-Null
cd ..

# Step 5: Build with only x86_64 (avoiding arm64-v8a CMake issues)
Write-Host "[5/5] Building for x86_64 architecture..." -ForegroundColor Yellow
Write-Host "Running: npx expo run:android --no-build-cache" -ForegroundColor Cyan
$env:EXPO_NO_DOTENV = "1"
npx expo run:android --no-build-cache







