Write-Host "=== Fixing Gradle Cache Corruption ===" -ForegroundColor Green

# Stop any running Gradle daemons
Write-Host "`n[1/5] Stopping Gradle daemons..." -ForegroundColor Yellow
cd android
.\gradlew.bat --stop
cd ..

# Clean Android build
Write-Host "`n[2/5] Cleaning Android build..." -ForegroundColor Yellow
if (Test-Path "android\build") {
    Remove-Item -Recurse -Force "android\build"
    Write-Host "Removed android/build" -ForegroundColor Green
}
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
    Write-Host "Removed android/app/build" -ForegroundColor Green
}

# Clean Gradle cache (transforms directory specifically)
Write-Host "`n[3/5] Cleaning corrupted Gradle cache..." -ForegroundColor Yellow
$gradleCache = "$env:USERPROFILE\.gradle\caches"
$transformsDir = "$gradleCache\8.14.3\transforms"

if (Test-Path $transformsDir) {
    Write-Host "Removing transforms directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $transformsDir -ErrorAction SilentlyContinue
    Write-Host "Removed transforms cache" -ForegroundColor Green
}

# Clean the specific problematic transform
$problematicTransform = "$gradleCache\8.14.3\transforms\8bca444e06763d64457172ec6b80f8aa"
if (Test-Path $problematicTransform) {
    Remove-Item -Recurse -Force $problematicTransform -ErrorAction SilentlyContinue
    Write-Host "Removed problematic transform cache" -ForegroundColor Green
}

# Clean expo-modules-core build cache
$expoModulesCache = "$gradleCache\modules-2\files-2.1\org.unimodules"
if (Test-Path $expoModulesCache) {
    Write-Host "Cleaning expo modules cache..." -ForegroundColor Yellow
    Get-ChildItem $expoModulesCache -Recurse -Filter "metadata.bin" | Remove-Item -Force -ErrorAction SilentlyContinue
}

# Clean Gradle user home cache more aggressively
Write-Host "`n[4/5] Performing deep cache clean..." -ForegroundColor Yellow
$gradleUserHome = "$env:USERPROFILE\.gradle"
$cacheDirs = @(
    "$gradleUserHome\caches\modules-2",
    "$gradleUserHome\caches\8.14.3\transforms-3",
    "$gradleUserHome\caches\8.14.3\fileHashes"
)

foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Write-Host "Cleaning $dir..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    }
}

# Clean node_modules/.cache if exists
Write-Host "`n[5/5] Cleaning node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
    Write-Host "Removed node_modules cache" -ForegroundColor Green
}

Write-Host "`n=== Cache Clean Complete ===" -ForegroundColor Green
Write-Host "Now run: npx expo run android" -ForegroundColor Cyan
