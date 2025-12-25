# Complete Android Build Fix Script
# This script performs a comprehensive cleanup and rebuild

Write-Host "Complete Android Build Fix" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean all build artifacts
Write-Host "Step 1: Cleaning build artifacts..." -ForegroundColor Yellow
if (Test-Path "android\build") {
    Remove-Item -Recurse -Force "android\build" -ErrorAction SilentlyContinue
}
if (Test-Path "android\.gradle") {
    Remove-Item -Recurse -Force "android\.gradle" -ErrorAction SilentlyContinue
}
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build" -ErrorAction SilentlyContinue
}
Write-Host "   Build directories cleaned" -ForegroundColor Green

# Step 2: Clean all CMake cache
Write-Host "Step 2: Cleaning CMake cache..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Recurse -Directory -Filter ".cxx" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue
}
Write-Host "   CMake cache cleaned" -ForegroundColor Green

# Step 3: Clean Gradle cache
Write-Host "Step 3: Cleaning Gradle..." -ForegroundColor Yellow
Set-Location android
.\gradlew clean --no-build-cache 2>&1 | Out-Null
Set-Location ..
Write-Host "   Gradle cleaned" -ForegroundColor Green

# Step 4: Verify cleanup
Write-Host "Step 4: Verifying cleanup..." -ForegroundColor Yellow
$remainingCxx = Get-ChildItem -Path "." -Recurse -Directory -Filter ".cxx" -ErrorAction SilentlyContinue
if ($remainingCxx) {
    Write-Host "   Found $($remainingCxx.Count) remaining .cxx directories, removing..." -ForegroundColor Yellow
    $remainingCxx | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "   Verification complete" -ForegroundColor Green

Write-Host ""
Write-Host "Complete cleanup finished!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run: npx expo run:android" -ForegroundColor Cyan
Write-Host ""
