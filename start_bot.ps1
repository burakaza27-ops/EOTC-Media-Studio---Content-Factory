# EOTC Media Studio — Quick Bot Launcher (no admin needed)
# Double-click or run in PowerShell to start the bot now.
Set-Location $PSScriptRoot
Write-Host "🤖 Starting EOTC Telegram Bot..." -ForegroundColor Cyan
Start-Process "cmd.exe" -ArgumentList "/c run_bot_forever.bat" -WorkingDirectory $PSScriptRoot
Write-Host "✅ Bot launched in background window!" -ForegroundColor Green

