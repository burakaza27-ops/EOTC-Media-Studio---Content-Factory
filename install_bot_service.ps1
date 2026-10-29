# ─────────────────────────────────────────────────────────────────────────────
# EOTC Media Studio — Install Bot as Windows Scheduled Task
# Run ONCE as Administrator to register the bot as a permanent startup service.
#
# Usage (in PowerShell as Admin):
#   .\install_bot_service.ps1
#
# To uninstall:
#   Unregister-ScheduledTask -TaskName "EOTC-TelegramBot" -Confirm:$false
# ─────────────────────────────────────────────────────────────────────────────

$TaskName   = "EOTC-TelegramBot"
$ProjectDir = $PSScriptRoot
$BatFile    = Join-Path $ProjectDir "run_bot_forever.bat"

Write-Host ""
Write-Host "🤖 EOTC Telegram Bot — Windows Task Scheduler Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Project : $ProjectDir"
Write-Host "  Script  : $BatFile"
Write-Host ""

# Remove existing task if present
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Write-Host "⚠  Removing existing task '$TaskName'..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Action: run the batch file (cmd /c keeps the window open with the loop)
$Action = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c `"$BatFile`"" `
    -WorkingDirectory $ProjectDir

# Trigger: run at user logon AND at system startup
$TriggerLogon  = New-ScheduledTaskTrigger -AtLogOn
$TriggerBoot   = New-ScheduledTaskTrigger -AtStartup

# Settings: restart on failure, run even if on battery, do NOT stop on idle
$Settings = New-ScheduledTaskSettingsSet `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -DontStopIfGoingOnBatteries `
    -DontStopOnIdleEnd

# Register the task for current user, highest run level
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $TriggerLogon, $TriggerBoot `
    -Settings $Settings `
    -RunLevel Highest `
    -Force

Write-Host ""
Write-Host "✅ Task '$TaskName' registered!" -ForegroundColor Green
Write-Host ""
Write-Host "   The bot will now start automatically:" -ForegroundColor White
Write-Host "   • At every Windows startup" -ForegroundColor White
Write-Host "   • At every user logon" -ForegroundColor White
Write-Host "   • Auto-restarts within 1 minute if it ever stops" -ForegroundColor White
Write-Host ""
Write-Host "   ▶  Starting the bot right now..." -ForegroundColor Cyan
Start-ScheduledTask -TaskName $TaskName
Write-Host "   🤖 Bot is now running in the background!" -ForegroundColor Green
Write-Host ""
Write-Host "   Logs: $ProjectDir\logs\bot.log" -ForegroundColor Gray
Write-Host ""
Write-Host "   To stop the bot: Stop-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
Write-Host "   To uninstall:    Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false" -ForegroundColor Gray
Write-Host ""

