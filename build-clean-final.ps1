Write-Host "=== Final Build Fix ===" -ForegroundColor Green

# Create temporary Gradle home
$tempGradleHome = "C:\temp-gradle-home-$(Get-Date -Format 'yyyyMMddHHmmss')"
Write-Host "Using temporary Gradle home: $tempGradleHome" -ForegroundColor Yellow

# Stop all Gradle
Write-Host "`n[1/4] Stopping Gradle..." -ForegroundColor Yellow
cd android
.\gradlew.bat --stop 2>&1 | Out-Null
cd ..
Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Clean everything
Write-Host "[2/4] Cleaning build directories..." -ForegroundColor Yellow
Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue

# Clean problematic cache
Write-Host "[3/4] Removing corrupted cache..." -ForegroundColor Yellow
Remove-Item -Path "$env:USERPROFILE\.gradle\caches\8.14.3\transforms" -Recurse -Force -ErrorAction SilentlyContinue

# Build with clean environment
Write-Host "[4/4] Building with clean environment..." -ForegroundColor Yellow
Write-Host "Command: npx expo run:android --no-build-cache" -ForegroundColor Cyan

$env:GRADLE_USER_HOME = $tempGradleHome
$env:EXPO_NO_DOTENV = "1"

try {
    npx expo run:android --no-build-cache
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "`n=== BUILD SUCCESSFUL ===" -ForegroundColor Green
        # Clean up temp directory after successful build
        Remove-Item -Path $tempGradleHome -Recurse -Force -ErrorAction SilentlyContinue
        exit 0
    } else {
        Write-Host "`n=== BUILD FAILED ===" -ForegroundColor Red
        exit $exitCode
    }
} catch {
    Write-Host "`n=== BUILD ERROR ===" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
} finally {
    # Clean up temp directory
    if (Test-Path $tempGradleHome) {
        Remove-Item -Path $tempGradleHome -Recurse -Force -ErrorAction SilentlyContinue
    }
}







