# Fix Turbopack junction point issue on Windows/OneDrive
# This script cleans up problematic junction points that cause Turbopack errors

Write-Host "Cleaning up Turbopack cache and junction points..." -ForegroundColor Yellow

# Remove .next directory
if (Test-Path ".next") {
    Write-Host "Removing .next directory..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

# Remove node_modules cache
if (Test-Path "node_modules\.cache") {
    Write-Host "Removing node_modules cache..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
}

# Remove any junction points in node_modules/@prisma/client
$prismaClientPath = "node_modules\@prisma\client"
if (Test-Path $prismaClientPath) {
    Write-Host "Checking Prisma client for junction points..." -ForegroundColor Cyan
    Get-ChildItem -Path $prismaClientPath -Force | Where-Object { $_.LinkType -eq "Junction" } | ForEach-Object {
        Write-Host "Removing junction: $($_.FullName)" -ForegroundColor Yellow
        Remove-Item -Force $_.FullName -ErrorAction SilentlyContinue
    }
}

Write-Host "Cleanup complete! Try running 'npm run dev' again." -ForegroundColor Green

