@echo off
title EOTC Media Studio - Telegram Bot Daemon
color 0B

:: ─────────────────────────────────────────────────────────────────────────────
:: EOTC Media Studio v7.0 — 24/7 Telegram Bot Daemon
:: Always run this script from ANY location — it self-relocates to the project.
:: ─────────────────────────────────────────────────────────────────────────────

:: Set working directory to the folder containing this bat file (project root)
cd /d "%~dp0"

echo ======================================================================
echo    EOTC Media Studio v7.0 - Interactive Telegram Bot Daemon
echo ======================================================================
echo.
echo  Project root : %~dp0
echo  Bot script   : src\telegram\concierge.js
echo  Log file     : logs\bot.log
echo.
echo  The bot will auto-restart within 5 seconds if it ever stops.
echo  Press Ctrl+C in this window to stop.
echo.

:: Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

:loop
echo [%date% %time%] ▶  Launching EOTC Telegram Bot...
echo [%date% %time%] Bot starting >> logs\bot.log

node src/telegram/concierge.js >> logs\bot.log 2>&1

echo.
echo [%date% %time%] ⚠  Bot stopped or crashed. Check logs\bot.log for details.
echo [%date% %time%] ⏳ Restarting in 5 seconds...
echo [%date% %time%] Bot stopped - restarting >> logs\bot.log
timeout /t 5 /nobreak >nul
goto loop
