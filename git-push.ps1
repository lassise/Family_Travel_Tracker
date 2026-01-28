# Git Push Script for Family Travel Tracker
# Handles lock files, proxy issues, and git operations

# Change to project directory
$projectPath = "C:\Dev\Family_Travel_Tracker"
Set-Location $projectPath

Write-Host "=== Git Push Script ===" -ForegroundColor Cyan
Write-Host "Project: $projectPath" -ForegroundColor Gray
Write-Host ""

# Step 1: Remove lock files
Write-Host "Step 1: Removing lock files..." -ForegroundColor Yellow
$lockFiles = @(
    ".git\index.lock",
    ".git\config.lock",
    ".git\refs\remotes\origin\main.lock"
)

foreach ($lockFile in $lockFiles) {
    $fullPath = Join-Path $projectPath $lockFile
    if (Test-Path $fullPath) {
        try {
            Remove-Item $fullPath -Force -ErrorAction Stop
            Write-Host "  ✓ Removed: $lockFile" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Could not remove: $lockFile - $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "  You may need to close other git processes or remove manually" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Step 2: Set proxy bypass for GitHub
Write-Host "Step 2: Setting proxy bypass for GitHub..." -ForegroundColor Yellow
$env:NO_PROXY = "github.com,*.github.com"
$env:no_proxy = "github.com,*.github.com"
Write-Host "  ✓ NO_PROXY set" -ForegroundColor Green
Write-Host ""

# Step 3: Check git status
Write-Host "Step 3: Checking git status..." -ForegroundColor Yellow
git status --short
Write-Host ""

# Step 4: Add all changes
Write-Host "Step 4: Adding all changes..." -ForegroundColor Yellow
try {
    git add -A
    Write-Host "  ✓ Changes staged" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Error adding files: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  If lock file error persists, close all git processes and try again" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 5: Commit
Write-Host "Step 5: Committing changes..." -ForegroundColor Yellow
$commitMessage = "feat: Multi-country trips with dates and combine feature - Phase 1 & 2 complete, combine trips feature added"
try {
    git commit -m $commitMessage
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Changes committed" -ForegroundColor Green
    } else {
        Write-Host "  ℹ No changes to commit (everything already committed)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Error committing: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Step 6: Push to remote
Write-Host "Step 6: Pushing to remote..." -ForegroundColor Yellow
try {
    git -c http.sslBackend=openssl -c credential.helper= push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Successfully pushed to remote" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Push failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "  You may need to check your git credentials or network connection" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Error pushing: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  You may need to check your git credentials or network connection" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Complete ===" -ForegroundColor Cyan
Write-Host "Script finished. Check output above for results." -ForegroundColor Gray
