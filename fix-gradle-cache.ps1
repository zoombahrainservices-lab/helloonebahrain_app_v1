# Script to fix Gradle cache corruption issues
Write-Host "Stopping Gradle daemons..." -ForegroundColor Yellow
cd android
.\gradlew.bat --stop

Write-Host "Cleaning Gradle cache..." -ForegroundColor Yellow
Remove-Item -Path "$env:USERPROFILE\.gradle\caches\8.14.3\transforms" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.gradle\caches\journal-1" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.gradle\caches\build-cache-1" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Cleaning project build directories..." -ForegroundColor Yellow
Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Cache cleanup complete!" -ForegroundColor Green
Write-Host "You can now run: npx expo run:android" -ForegroundColor Green








