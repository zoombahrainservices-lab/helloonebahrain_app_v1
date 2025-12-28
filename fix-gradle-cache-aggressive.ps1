# Aggressive Gradle Cache Fix
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Aggressive Gradle Cache Cleanup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Stop Gradle daemons first
Write-Host ""
Write-Host "[1/5] Stopping all Gradle daemons..." -ForegroundColor Yellow
cd android
.\gradlew.bat --stop 2>&1 | Out-Null
Start-Sleep -Seconds 2
cd ..

# Remove the entire Gradle cache (more aggressive)
Write-Host "[2/5] Removing entire Gradle 8.14.3 cache..." -ForegroundColor Yellow
$gradleCache = "$env:USERPROFILE\.gradle\caches\8.14.3"
if (Test-Path $gradleCache) {
    # Kill any processes that might be locking files
    Get-Process | Where-Object {$_.Path -like "*gradle*"} | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    
    # Remove with retry mechanism
    $retries = 3
    $removed = $false
    for ($i = 1; $i -le $retries; $i++) {
        try {
            Remove-Item -Path $gradleCache -Recurse -Force -ErrorAction Stop
            $removed = $true
            Write-Host "   Successfully removed Gradle cache (attempt $i)" -ForegroundColor Green
            break
        } catch {
            Write-Host "   Attempt $i failed, retrying..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    if (-not $removed) {
        Write-Host "   WARNING: Could not fully remove cache, but continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "   Gradle cache already removed" -ForegroundColor Green
}

# Remove the specific problematic transform
Write-Host "[3/5] Removing problematic transform cache..." -ForegroundColor Yellow
$problemTransform = "$env:USERPROFILE\.gradle\caches\8.14.3\transforms\8bca444e06763d64457172ec6b80f8aa"
if (Test-Path $problemTransform) {
    Remove-Item -Path $problemTransform -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Removed problematic transform" -ForegroundColor Green
}

# Clean Android build
Write-Host "[4/5] Cleaning Android build directories..." -ForegroundColor Yellow
if (Test-Path "android\app\build") {
    Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "android\build") {
    Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "android\.gradle") {
    Remove-Item -Path "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "   Android build directories cleaned" -ForegroundColor Green

# Run Gradle clean
Write-Host "[5/5] Running Gradle clean..." -ForegroundColor Yellow
cd android
.\gradlew.bat clean --no-daemon --no-build-cache 2>&1 | Out-Null
cd ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Aggressive cleanup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Run 'npx expo run android' again" -ForegroundColor Cyan

