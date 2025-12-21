# Build and Install Android Development Build
# This script builds and installs the app on Android emulator/device

Write-Host "🔨 Building Android Development Build..." -ForegroundColor Cyan

# Clear all caches (fixes CMake and Metro errors)
Write-Host ""
Write-Host "🧹 Clearing all caches..." -ForegroundColor Yellow

# Clear CMake cache (fixes "unrecognized RECORD_NOT_SET" error)
Write-Host "   Cleaning CMake cache..." -ForegroundColor Gray
Get-ChildItem -Path "node_modules" -Recurse -Directory -Filter ".cxx" -ErrorAction SilentlyContinue | 
    ForEach-Object {
        Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue
    }
Write-Host "   ✅ Cleared CMake cache" -ForegroundColor Green

# Clear Metro bundler cache
if (Test-Path "$env:TEMP\metro-*") {
    Get-ChildItem "$env:TEMP\metro-*" -Recurse | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cleared Metro temp cache" -ForegroundColor Green
}
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cleared .expo cache" -ForegroundColor Green
}
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cleared node_modules cache" -ForegroundColor Green
}

# Check if Android emulator is running
Write-Host ""
Write-Host "📱 Checking for Android emulator..." -ForegroundColor Yellow
$emulatorRunning = adb devices | Select-String -Pattern "emulator" -Quiet

if (-not $emulatorRunning) {
    Write-Host "⚠️  No Android emulator detected. Starting emulator..." -ForegroundColor Yellow
    Write-Host "💡 Make sure you have an Android emulator configured in Android Studio" -ForegroundColor Yellow
    Write-Host "💡 Or start an emulator manually and run this script again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to continue anyway (will fail if no device)..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Clean Android build directories
Write-Host ""
Write-Host "🧹 Cleaning Android build directories..." -ForegroundColor Yellow
cd android

# Clean build directory
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cleared android/build" -ForegroundColor Green
}

# Clean .gradle directory
if (Test-Path ".gradle") {
    Remove-Item -Recurse -Force ".gradle" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cleared android/.gradle" -ForegroundColor Green
}

# Clean app build directory
if (Test-Path "app\build") {
    Remove-Item -Recurse -Force "app\build" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cleared android/app/build" -ForegroundColor Green
}

# Clean any .cxx directories in android folder
Get-ChildItem -Path "." -Recurse -Directory -Filter ".cxx" -ErrorAction SilentlyContinue | 
    ForEach-Object {
        Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue
    }

cd ..

# Build and install
Write-Host ""
Write-Host "🔨 Building and installing app..." -ForegroundColor Cyan
Write-Host "⏳ This may take 5-10 minutes on first build..." -ForegroundColor Yellow
Write-Host "⏳ Cleaning Gradle cache first..." -ForegroundColor Yellow
Write-Host ""

# Clean Gradle cache before building
cd android
.\gradlew clean --no-daemon
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Gradle clean had warnings, continuing anyway..." -ForegroundColor Yellow
}
cd ..

Write-Host ""
Write-Host "🚀 Starting build..." -ForegroundColor Cyan
Write-Host ""

npx expo run:android

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build successful! App should be installed on emulator/device." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Build failed. Check the error messages above." -ForegroundColor Red
    Write-Host "💡 Common fixes:" -ForegroundColor Yellow
    Write-Host "   1. Make sure Android emulator is running" -ForegroundColor Yellow
    Write-Host "   2. Run: cd android && ./gradlew clean && cd .." -ForegroundColor Yellow
    Write-Host "   3. Check that you have Android SDK installed" -ForegroundColor Yellow
}





