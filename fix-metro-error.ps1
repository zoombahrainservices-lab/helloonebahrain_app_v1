# Safe Metro Bundler Fix Script
# This script fixes the "dependencies is not iterable" error without breaking the app

Write-Host "[INFO] Starting safe Metro bundler fix..." -ForegroundColor Cyan
Write-Host "[INFO] This will clean caches and reinstall dependencies" -ForegroundColor Yellow
Write-Host ""

# Step 1: Stop any running Metro/Expo processes
Write-Host "[1/6] Stopping running processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
    $_.MainWindowTitle -like "*metro*" -or 
    $_.MainWindowTitle -like "*expo*" -or
    $_.CommandLine -like "*metro*" -or 
    $_.CommandLine -like "*expo*" 
} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Clear npm cache
Write-Host "[2/6] Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>$null

# Step 3: Clear Metro bundler cache
Write-Host "[3/6] Clearing Metro bundler cache..." -ForegroundColor Yellow
if (Test-Path "$env:TEMP\metro-*") {
    Remove-Item "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "$env:TEMP\haste-map-*") {
    Remove-Item "$env:TEMP\haste-map-*" -Recurse -Force -ErrorAction SilentlyContinue
}

# Step 4: Clear Expo cache
Write-Host "[4/6] Clearing Expo cache..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item ".expo" -Recurse -Force -ErrorAction SilentlyContinue
}

# Step 5: Remove node_modules and package-lock.json
Write-Host "[5/6] Removing old dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
}

# Step 6: Install dependencies with legacy peer deps to handle version conflicts
Write-Host "[6/6] Installing dependencies (this may take 3-5 minutes)..." -ForegroundColor Yellow
Write-Host ""
npm install --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] Fix complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: npx expo start --clear" -ForegroundColor White
    Write-Host "  2. Press 'a' to open Android emulator" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] Installation failed. Please check the errors above." -ForegroundColor Red
    Write-Host ""
}

