# Fast Emulator Startup Script
# Optimizes emulator startup time

Write-Host "🚀 Starting Android Emulator (Optimized)..." -ForegroundColor Cyan
Write-Host ""

# Kill any existing emulator processes
Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -like "*emulator*" -or $_.ProcessName -like "*qemu*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Restart ADB
Write-Host "🔄 Restarting ADB..." -ForegroundColor Yellow
adb kill-server
Start-Sleep -Seconds 1
adb start-server

# List available emulators
Write-Host ""
Write-Host "📱 Available Emulators:" -ForegroundColor Cyan
$emulators = emulator -list-avds
if ($emulators) {
    $emulators | ForEach-Object { Write-Host "   - $_" -ForegroundColor White }
} else {
    Write-Host "   ⚠️  No emulators found. Create one in Android Studio first." -ForegroundColor Red
    exit 1
}

# Get first emulator or ask user
$emulatorName = ($emulators -split "`n" | Where-Object { $_.Trim() -ne "" } | Select-Object -First 1).Trim()

if (-not $emulatorName) {
    Write-Host "❌ No emulator found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting emulator: $emulatorName" -ForegroundColor Cyan
Write-Host "⏳ This may take 1-2 minutes..." -ForegroundColor Yellow
Write-Host ""

# Start emulator with optimizations
# -no-snapshot-load: Cold boot (faster, more reliable)
# -no-snapshot-save: Don't save snapshot (faster shutdown)
# -no-audio: Disable audio (faster startup)
# -gpu swiftshader_indirect: Use software rendering (more compatible)
Start-Process -FilePath "emulator" -ArgumentList "-avd", $emulatorName, "-no-snapshot-load", "-no-snapshot-save", "-no-audio", "-gpu", "swiftshader_indirect" -WindowStyle Minimized

# Wait for emulator to be ready
Write-Host "⏳ Waiting for emulator to boot..." -ForegroundColor Yellow
$maxWait = 120 # 2 minutes max
$elapsed = 0
$ready = $false

while ($elapsed -lt $maxWait -and -not $ready) {
    Start-Sleep -Seconds 3
    $elapsed += 3
    
    $devices = adb devices
    if ($devices -match "emulator.*device") {
        $ready = $true
        Write-Host "✅ Emulator is ready!" -ForegroundColor Green
        break
    }
    
    Write-Host "   Still booting... ($elapsed seconds)" -ForegroundColor Gray
}

if (-not $ready) {
    Write-Host "Warning: Emulator taking longer than expected. It may still be starting." -ForegroundColor Yellow
    Write-Host "Tip: Check Android Studio Device Manager for status" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "✅ Emulator ready! You can now run:" -ForegroundColor Green
    Write-Host "   npx expo run:android" -ForegroundColor Cyan
    Write-Host ""
}




