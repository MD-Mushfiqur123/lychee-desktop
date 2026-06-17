@echo off
setlocal enabledelayedexpansion
title Lychee Desktop — Quick Installer

:: ────────────────────────────────────────────────────────────────────
:: Lychee Desktop — Quick Install (No Admin Required)
:: ────────────────────────────────────────────────────────────────────
:: This script copies lychee-desktop.exe to a local Programs folder
:: and creates Start Menu and Desktop shortcuts.
::
:: Advantages: No NSIS needed, no admin rights required, double-click.
:: ────────────────────────────────────────────────────────────────────

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║   Lychee Desktop — Quick Installer               ║
echo ╚══════════════════════════════════════════════════╝
echo.

:: ── Step 1: Find lychee-desktop.exe ──────────────────────────────────
set "EXE_PATH="

:: Search in order: build\bin, dist, root
if exist "..\build\bin\lychee-desktop.exe" (
    set "EXE_PATH=..\build\bin\lychee-desktop.exe"
)
if "%EXE_PATH%"=="" (
    if exist "..\dist\lychee-desktop.exe" (
        set "EXE_PATH=..\dist\lychee-desktop.exe"
    )
)
if "%EXE_PATH%"=="" (
    if exist "..\lychee-desktop.exe" (
        set "EXE_PATH=..\lychee-desktop.exe"
    )
)

if "%EXE_PATH%"=="" (
    echo [ERROR] Cannot find lychee-desktop.exe
    echo.
    echo Searched:
    echo   ..\build\bin\lychee-desktop.exe
    echo   ..\dist\lychee-desktop.exe
    echo   ..\lychee-desktop.exe
    echo.
    echo Build the app first or place this script next to lychee-desktop.exe
    echo.
    pause
    exit /b 1
)

echo [1/4] Found: %EXE_PATH%

:: ── Step 2: Create install directory ─────────────────────────────────
set "INSTALL_DIR=%LOCALAPPDATA%\Programs\Lychee Desktop"
set "START_MENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Lychee Desktop"
set "DESKTOP=%USERPROFILE%\Desktop"

echo [2/4] Installing to: %INSTALL_DIR%

:: Create directories
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%START_MENU%"  mkdir "%START_MENU%"

:: ── Step 3: Copy files ───────────────────────────────────────────────
echo [3/4] Copying files...

copy /Y "%EXE_PATH%" "%INSTALL_DIR%\lychee-desktop.exe" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to copy lychee-desktop.exe
    echo Is the file in use? Close Lychee Desktop and try again.
    pause
    exit /b 1
)

:: ── Step 4: Create shortcuts ─────────────────────────────────────────
echo [4/4] Creating shortcuts...

:: Start Menu shortcut
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$WshShell = New-Object -ComObject WScript.Shell; " ^
    "$s = $WshShell.CreateShortcut('%START_MENU%\Lychee Desktop.lnk'); " ^
    "$s.TargetPath = '%INSTALL_DIR%\lychee-desktop.exe'; " ^
    "$s.WorkingDirectory = '%INSTALL_DIR%'; " ^
    "$s.Description = 'Lychee Desktop - Universal LLM Runtime'; " ^
    "$s.IconLocation = '%INSTALL_DIR%\lychee-desktop.exe,0'; " ^
    "$s.Save()"

if %ERRORLEVEL% equ 0 (
    echo   ✓ Start Menu shortcut created
) else (
    echo   ⚠ Could not create Start Menu shortcut
)

:: Desktop shortcut
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$WshShell = New-Object -ComObject WScript.Shell; " ^
    "$s = $WshShell.CreateShortcut('%DESKTOP%\Lychee Desktop.lnk'); " ^
    "$s.TargetPath = '%INSTALL_DIR%\lychee-desktop.exe'; " ^
    "$s.WorkingDirectory = '%INSTALL_DIR%'; " ^
    "$s.Description = 'Lychee Desktop - Universal LLM Runtime'; " ^
    "$s.IconLocation = '%INSTALL_DIR%\lychee-desktop.exe,0'; " ^
    "$s.Save()"

if %ERRORLEVEL% equ 0 (
    echo   ✓ Desktop shortcut created
) else (
    echo   ⚠ Could not create Desktop shortcut
)

:: ── Done ─────────────────────────────────────────────────────────────
echo.
echo ╔══════════════════════════════════════════════════╗
echo ║   ✓  INSTALLATION COMPLETE!                      ║
echo ╚══════════════════════════════════════════════════╝
echo.
echo   Installed to: %INSTALL_DIR%
echo   Start Menu:   %START_MENU%
echo   Desktop:      %DESKTOP%\Lychee Desktop.lnk
echo.
echo   Launch from Start Menu or double-click the Desktop shortcut.
echo.
echo   To uninstall, delete:
echo     %INSTALL_DIR%
echo     %START_MENU%
echo     %DESKTOP%\Lychee Desktop.lnk
echo.

pause
