# Clean Android Build Script
# This script cleans all build artifacts and caches to fix build issues

Write-Host "🧹 Cleaning Android build artifacts..." -ForegroundColor Cyan

# Clean Android build directories
if (Test-Path "android\build") {
    Remove-Item -Recurse -Force "android\build"
    Write-Host "✅ Cleaned android\build" -ForegroundColor Green
}

if (Test-Path "android\.gradle") {
    Remove-Item -Recurse -Force "android\.gradle"
    Write-Host "✅ Cleaned android\.gradle" -ForegroundColor Green
}

if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
    Write-Host "✅ Cleaned android\app\build" -ForegroundColor Green
}

# Clean corrupted CMake cache files (thorough cleanup)
if (Test-Path "android\app\.cxx") {
    Remove-Item -Recurse -Force "android\app\.cxx"
    Write-Host "✅ Cleaned app .cxx directory" -ForegroundColor Green
}

# Clean all .cxx directories in android folder
Get-ChildItem -Path "android" -Recurse -Directory -Filter ".cxx" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Recurse -Force $_.FullName
    Write-Host "✅ Cleaned $($_.FullName)" -ForegroundColor Green
}

# Clean all .cxx directories in node_modules
Get-ChildItem -Path "node_modules" -Recurse -Directory -Filter ".cxx" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Recurse -Force $_.FullName
    Write-Host "✅ Cleaned $($_.FullName)" -ForegroundColor Green
}

# Run Gradle clean with no cache
Write-Host "`n🔨 Running Gradle clean (no cache)..." -ForegroundColor Cyan
Set-Location android
.\gradlew clean --no-build-cache
Set-Location ..

# Final verification - ensure no .cxx directories exist
Write-Host "`n🔍 Verifying cleanup..." -ForegroundColor Cyan
$remainingCxx = Get-ChildItem -Path "." -Recurse -Directory -Filter ".cxx" -ErrorAction SilentlyContinue
if ($remainingCxx) {
    Write-Host "⚠️  Found remaining .cxx directories, removing..." -ForegroundColor Yellow
    $remainingCxx | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "✅ All .cxx directories cleaned" -ForegroundColor Green
}

Write-Host "`n✅ Clean completed! You can now run: npx expo run:android" -ForegroundColor Green

