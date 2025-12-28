# Script to build with automatic cache cleanup on failure
param(
    [switch]$RetryOnFailure = $true
)

$maxRetries = 3
$attempt = 1

function Clean-TransformCache {
    Write-Host "Cleaning transform cache..." -ForegroundColor Yellow
    $paths = @(
        "$env:USERPROFILE\.gradle\caches\8.14.3\transforms",
        "$env:USERPROFILE\.gradle\caches\transforms-3"
    )
    
    foreach ($path in $paths) {
        if (Test-Path $path) {
            Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  Removed: $path" -ForegroundColor Green
        }
    }
}

function Stop-Gradle {
    Write-Host "Stopping Gradle..." -ForegroundColor Yellow
    cd android
    .\gradlew.bat --stop 2>&1 | Out-Null
    cd ..
    Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

do {
    Write-Host "`n=== Build Attempt $attempt/$maxRetries ===" -ForegroundColor Cyan
    
    # Clean before each attempt
    Stop-Gradle
    Clean-TransformCache
    
    # Build
    Write-Host "Building with: npx expo run:android" -ForegroundColor Yellow
    $buildResult = & npx expo run:android 2>&1
    
    # Check if build succeeded
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n=== BUILD SUCCESSFUL ===" -ForegroundColor Green
        exit 0
    }
    
    # Check if it's the transform cache error
    if ($buildResult -match "metadata\.bin" -or $buildResult -match "transforms") {
        Write-Host "`nTransform cache error detected. Cleaning and retrying..." -ForegroundColor Red
        $attempt++
        Start-Sleep -Seconds 3
    } else {
        Write-Host "`nBuild failed with different error:" -ForegroundColor Red
        $buildResult | Select-Object -Last 30
        exit 1
    }
    
} while ($attempt -le $maxRetries -and $RetryOnFailure)

Write-Host "`n=== BUILD FAILED after $maxRetries attempts ===" -ForegroundColor Red
exit 1







