# Comprehensive fix and build script
$ErrorActionPreference = "Continue"

Write-Host "=== Complete Build Fix Script ===" -ForegroundColor Green

function Remove-TransformCache {
    Write-Host "`n[Step 1] Removing transform cache..." -ForegroundColor Yellow
    $cachePath = "$env:USERPROFILE\.gradle\caches\8.14.3\transforms\8bca444e06763d64457172ec6b80f8aa"
    
    if (Test-Path $cachePath) {
        # Kill any processes using this directory
        Get-Process | Where-Object { $_.Path -like "*gradle*" -or $_.Path -like "*java*" } | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        
        # Force remove with retries
        $maxRetries = 5
        $retry = 0
        while ($retry -lt $maxRetries) {
            try {
                Remove-Item -Path $cachePath -Recurse -Force -ErrorAction Stop
                Write-Host "  Removed problematic transform cache" -ForegroundColor Green
                break
            } catch {
                $retry++
                if ($retry -lt $maxRetries) {
                    Write-Host "  Retrying removal (attempt $retry/$maxRetries)..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 2
                    cmd /c "rmdir /s /q `"$cachePath`"" 2>&1 | Out-Null
                } else {
                    Write-Host "  Could not remove, will try during build" -ForegroundColor Yellow
                }
            }
        }
    }
    
    # Remove entire transforms directory
    $transformsDir = "$env:USERPROFILE\.gradle\caches\8.14.3\transforms"
    if (Test-Path $transformsDir) {
        Remove-Item -Path $transformsDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Removed transforms directory" -ForegroundColor Green
    }
}

function Stop-GradleCompletely {
    Write-Host "`n[Step 2] Stopping all Gradle processes..." -ForegroundColor Yellow
    cd android
    .\gradlew.bat --stop 2>&1 | Out-Null
    cd ..
    
    Get-Process | Where-Object { $_.ProcessName -eq "java" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    Write-Host "  Gradle stopped" -ForegroundColor Green
}

function Clean-BuildDirectories {
    Write-Host "`n[Step 3] Cleaning build directories..." -ForegroundColor Yellow
    Remove-Item -Path "android\build" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  Build directories cleaned" -ForegroundColor Green
}

function Build-Android {
    Write-Host "`n[Step 4] Starting build..." -ForegroundColor Yellow
    
    # Set environment to prevent cache usage
    $env:GRADLE_OPTS = "-Dorg.gradle.caching=false -Dorg.gradle.configureondemand=false"
    
    try {
        # Build
        Write-Host "  Running: npx expo run:android" -ForegroundColor Cyan
        & npx expo run:android
        
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Host "`n=== BUILD SUCCESSFUL ===" -ForegroundColor Green
            return $true
        } else {
            Write-Host "`n=== BUILD FAILED (Exit Code: $exitCode) ===" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "`n=== BUILD ERROR ===" -ForegroundColor Red
        Write-Host $_.Exception.Message
        return $false
    }
}

# Main execution
Write-Host "`nStarting fix and build process..." -ForegroundColor Cyan

Remove-TransformCache
Stop-GradleCompletely
Clean-BuildDirectories

# Build with retries
$maxBuildRetries = 3
$buildAttempt = 1
$buildSuccess = $false

while ($buildAttempt -le $maxBuildRetries -and -not $buildSuccess) {
    Write-Host "`n--- Build Attempt $buildAttempt/$maxBuildRetries ---" -ForegroundColor Cyan
    
    # Clean cache before each attempt
    if ($buildAttempt -gt 1) {
        Remove-TransformCache
        Stop-GradleCompletely
        Start-Sleep -Seconds 2
    }
    
    $buildSuccess = Build-Android
    
    if (-not $buildSuccess) {
        $buildAttempt++
        if ($buildAttempt -le $maxBuildRetries) {
            Write-Host "`nRetrying build..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    }
}

if ($buildSuccess) {
    Write-Host "`n=== FINAL BUILD SUCCESSFUL ===" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n=== BUILD FAILED AFTER $maxBuildRetries ATTEMPTS ===" -ForegroundColor Red
    exit 1
}
