# PowerShell script to add NextAuth environment variables to .env file

$envFile = ".env"
$nextAuthUrl = "http://localhost:3000"
$nextAuthSecret = "W8zZhQJLlsppUONbac8XU0hSJEU45uHEvM0zIaWL+Wk="

# Check if .env file exists
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    # Check if NEXTAUTH_URL already exists
    if ($content -match "NEXTAUTH_URL") {
        Write-Host "NEXTAUTH_URL already exists in .env file" -ForegroundColor Yellow
    } else {
        Add-Content -Path $envFile -Value "`n# NextAuth"
        Add-Content -Path $envFile -Value "NEXTAUTH_URL=`"$nextAuthUrl`""
        Write-Host "✅ Added NEXTAUTH_URL to .env" -ForegroundColor Green
    }
    
    # Check if NEXTAUTH_SECRET already exists
    if ($content -match "NEXTAUTH_SECRET") {
        Write-Host "NEXTAUTH_SECRET already exists in .env file" -ForegroundColor Yellow
    } else {
        Add-Content -Path $envFile -Value "NEXTAUTH_SECRET=`"$nextAuthSecret`""
        Write-Host "✅ Added NEXTAUTH_SECRET to .env" -ForegroundColor Green
    }
    
    Write-Host "`n✅ NextAuth environment variables setup complete!" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found. Please create it first." -ForegroundColor Red
    exit 1
}







