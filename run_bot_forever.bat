@echo off
title EOTC Media Studio - Telegram Bot Daemon
color 0B
echo ======================================================================
echo    EOTC Media Studio v7.0 - Interactive Telegram Bot Daemon
echo ======================================================================
echo.
echo Starting bot and maintaining 24/7 uptime...
echo If the process ever exits or crashes, it will auto-restart in 3 seconds.
echo Press Ctrl+C in this window to stop.
echo.

:loop
echo [%date% %time%] Launching bot concierge...
node src/telegram/concierge.js
echo.
echo [%date% %time%] Bot stopped or connection cycled. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop
