# ATLINE Backend - Auto Build & Package for cPanel
# Run this script, then upload the ZIP file

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ATLINE Backend - Build & Package Script   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Step 1: Clean old build
Write-Host "🧹 Step 1/5: Cleaning old build..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "   ✅ Deleted .next folder" -ForegroundColor Green
}
Write-Host ""

# Step 2: Install dependencies
Write-Host "📦 Step 2/5: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Build production
Write-Host "🔨 Step 3/5: Building production..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Build completed" -ForegroundColor Green
Write-Host ""

# Step 4: Verify build structure
Write-Host "🔍 Step 4/5: Verifying build..." -ForegroundColor Yellow

$checks = @{
    ".next folder" = Test-Path ".next"
    ".next/static folder" = Test-Path ".next/static"
    "BUILD_ID file" = Test-Path ".next/BUILD_ID"
    "start.js file" = Test-Path "start.js"
}

$allGood = $true
foreach ($check in $checks.GetEnumerator()) {
    if ($check.Value) {
        Write-Host "   ✅ $($check.Key)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $($check.Key) NOT FOUND" -ForegroundColor Red
        $allGood = $false
    }
}

if (-not $allGood) {
    Write-Host ""
    Write-Host "❌ Build verification failed!" -ForegroundColor Red
    exit 1
}

# Check static folder structure
if (Test-Path ".next/static/prod") {
    Write-Host "   ✅ Static files in /prod/ folder (consistent BUILD_ID)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Static files not in /prod/ folder" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Create deployment package
Write-Host "📦 Step 5/5: Creating deployment package..." -ForegroundColor Yellow

$items = @(
    ".next",
    "pages",
    "components",
    "lib",
    "styles",
    "public",
    "prisma",
    "scripts",
    "start.js",
    "next.config.ts",
    "package.json",
    "package-lock.json",
    ".env.production",
    "tsconfig.json"
)

# Verify all items exist
$missingItems = @()
foreach ($item in $items) {
    if (-not (Test-Path $item)) {
        $missingItems += $item
    }
}

if ($missingItems.Count -gt 0) {
    Write-Host "   ⚠️  Warning: These items not found:" -ForegroundColor Yellow
    foreach ($missing in $missingItems) {
        Write-Host "      - $missing" -ForegroundColor Yellow
    }
}

$zipFile = "atline-backend-FINAL.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

# Create zip (only existing items)
$existingItems = $items | Where-Object { Test-Path $_ }
Compress-Archive -Path $existingItems -DestinationPath $zipFile -Force

if (Test-Path $zipFile) {
    $fileSize = (Get-Item $zipFile).Length / 1MB
    Write-Host "   ✅ Package created: $zipFile" -ForegroundColor Green
    Write-Host "   📊 Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "   ❌ Failed to create ZIP" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              BUILD SUCCESSFUL!               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Upload to cPanel:" -ForegroundColor White
Write-Host "   File: $zipFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "2️⃣  Extract di server (Terminal):" -ForegroundColor White
Write-Host "   cd /home/malaysiadev/scm-core.malaysiadev.com" -ForegroundColor Yellow
Write-Host "   unzip -o atline-backend-FINAL.zip" -ForegroundColor Yellow
Write-Host "   chmod +x start.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "3️⃣  cPanel → Setup Node.js App:" -ForegroundColor White
Write-Host "   Application startup file: start.js" -ForegroundColor Yellow
Write-Host "   Click RESTART" -ForegroundColor Yellow
Write-Host ""
Write-Host "4️⃣  Test:" -ForegroundColor White
Write-Host "   https://scm-core.malaysiadev.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Ready to upload!" -ForegroundColor Green
Write-Host ""
