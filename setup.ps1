# ============================================================
# Strapi JpSys - Windows Environment Setup Script
# ============================================================

$ErrorActionPreference = "Stop"
Clear-Host

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Automatic Setup for Strapi JpSys" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Install k6 if missing
Write-Host "`n[1/3] 🔍 Checking k6 installation..." -ForegroundColor Yellow
if (Get-Command k6 -ErrorAction SilentlyContinue) {
    Write-Host "✅ k6 is already installed!" -ForegroundColor Green
    k6 version
} else {
    Write-Host "❌ k6 is not installed. Installing k6 via winget..." -ForegroundColor Cyan
    try {
        winget install k6 --source winget --accept-package-agreements --accept-source-agreements
        Write-Host "✅ k6 installation complete!" -ForegroundColor Green
        Write-Host "⚠️  NOTE: You MUST restart your terminal or VS Code after this setup for the 'k6' command to work." -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Failed to install k6 automatically. Please install it manually: winget install k6" -ForegroundColor Red
    }
}

# 2. Install Root Dependencies (Strapi)
Write-Host "`n[2/3] 📦 Installing main project dependencies (Strapi)..." -ForegroundColor Yellow
npm install
Write-Host "✅ Main project dependencies installed!" -ForegroundColor Green

# 3. Setup E2E Project (Playwright)
Write-Host "`n[3/3] 🎭 Setting up E2E tests (Playwright)..." -ForegroundColor Yellow
cd e2e-tests
npm install
Write-Host "📥 Installing Playwright browsers..." -ForegroundColor Cyan
npx playwright install
cd ..
Write-Host "✅ E2E tests and browsers set up successfully!" -ForegroundColor Green

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "👉 PLEASE RESTART YOUR TERMINAL / VS CODE to apply changes." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
