# Complete Fix Script - Fixes all issues and gets app running
Write-Host "[INFO] Starting complete fix..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop processes
Write-Host "[1/7] Stopping processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Clear all caches
Write-Host "[2/7] Clearing caches..." -ForegroundColor Yellow
npm cache clean --force 2>$null
if (Test-Path "$env:TEMP\metro-*") {
    Remove-Item "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path ".expo") {
    Remove-Item ".expo" -Recurse -Force -ErrorAction SilentlyContinue
}

# Step 3: Remove old dependencies
Write-Host "[3/7] Removing old dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
}

# Step 4: Install dependencies
Write-Host "[4/7] Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Installation failed!" -ForegroundColor Red
    exit 1
}

# Step 5: Clear Android build cache
Write-Host "[5/7] Clearing Android build cache..." -ForegroundColor Yellow
if (Test-Path "android\.gradle") {
    Remove-Item "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "android\app\build") {
    Remove-Item "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
}

# Step 6: Prebuild (to ensure native config is correct)
Write-Host "[6/7] Running Expo prebuild..." -ForegroundColor Yellow
npx expo prebuild --clean --platform android 2>$null

# Step 7: Success message
Write-Host ""
Write-Host "[SUCCESS] All fixes complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npx expo start --clear" -ForegroundColor White
Write-Host "  2. Press 'a' for Android or scan QR code" -ForegroundColor White
Write-Host ""



