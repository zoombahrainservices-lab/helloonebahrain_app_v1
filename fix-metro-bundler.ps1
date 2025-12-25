# Comprehensive Metro Bundler Fix Script
# This script fixes the "dependencies is not iterable" error

Write-Host "[INFO] Starting Metro Bundler Fix..." -ForegroundColor Cyan

# Step 1: Stop any running Metro bundler processes
Write-Host "`n[1/9] Stopping Metro bundler processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*metro*" -or $_.CommandLine -like "*expo*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Clear Metro bundler cache
Write-Host "`n[2/9] Clearing Metro bundler cache..." -ForegroundColor Yellow
if (Test-Path "$env:TEMP\metro-*") {
    Remove-Item "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "$env:TEMP\haste-map-*") {
    Remove-Item "$env:TEMP\haste-map-*" -Recurse -Force -ErrorAction SilentlyContinue
}
# Note: We'll clear cache when starting expo later

# Step 3: Clear watchman cache (if installed)
Write-Host "`n[3/9] Clearing Watchman cache..." -ForegroundColor Yellow
if (Get-Command watchman -ErrorAction SilentlyContinue) {
    watchman watch-del-all 2>$null
}

# Step 4: Remove node_modules and reinstall
Write-Host "`n[4/9] Removing node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

# Step 5: Clear npm cache
Write-Host "`n[5/9] Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Step 6: Remove package-lock.json and reinstall
Write-Host "`n[6/9] Removing package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
}

# Step 7: Reinstall dependencies
Write-Host "`n[7/9] Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
npm install

# Step 8: Clear Expo cache
Write-Host "`n[8/9] Clearing Expo cache..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item ".expo" -Recurse -Force -ErrorAction SilentlyContinue
}

# Step 9: Clear Android build cache
Write-Host "`n[9/9] Clearing Android build cache..." -ForegroundColor Yellow
if (Test-Path "android\.gradle") {
    Remove-Item "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "android\app\build") {
    Remove-Item "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "`n[SUCCESS] Fix complete! Now run: npm start" -ForegroundColor Green
Write-Host "`nIf the issue persists, try:" -ForegroundColor Yellow
Write-Host "  1. npx expo start --clear" -ForegroundColor White
Write-Host "  2. Close and reopen your terminal" -ForegroundColor White
Write-Host "  3. Restart your computer" -ForegroundColor White
