@echo off
title Lychee Desktop
echo ================================================
echo           Lychee Desktop Launcher
echo ================================================
echo.
echo Starting Lychee serve in background...
start "" /B lychee serve
echo Waiting for API to be ready...
timeout /t 3 /nobreak >nul
echo Launching Lychee Desktop...
start "" "%~dp0\..\lychee-desktop.exe"
echo.
echo Lychee Desktop is running!
echo Close this window when you're done.
echo.
pause
