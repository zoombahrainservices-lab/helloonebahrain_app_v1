# Pre-build Clean Script
# Run this before every Android build to prevent CMake cache corruption

Write-Host "🧹 Pre-build cleanup..." -ForegroundColor Cyan

# Clean all .cxx directories (CMake cache)
$cxxDirs = Get-ChildItem -Path "." -Recurse -Directory -Filter ".cxx" -ErrorAction SilentlyContinue
if ($cxxDirs) {
    Write-Host "   Removing $($cxxDirs.Count) .cxx directories..." -ForegroundColor Yellow
    $cxxDirs | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cleaned CMake cache" -ForegroundColor Green
}

# Clean specific problematic paths
$problemPaths = @(
    "node_modules\react-native-screens\android\.cxx",
    "node_modules\expo-modules-core\android\.cxx",
    "android\app\.cxx"
)

foreach ($path in $problemPaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
        Write-Host "   ✅ Cleaned $path" -ForegroundColor Green
    }
}

Write-Host "✅ Pre-build cleanup complete" -ForegroundColor Green




