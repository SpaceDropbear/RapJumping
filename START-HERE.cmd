@echo off
title Rap Jumping - local preview
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js / npm was not found.
  echo Install the LTS version from https://nodejs.org then double-click this file again.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies - this only happens the first time and takes a minute...
  echo.
  call npm install
  echo.
)

echo ============================================================
echo  Starting your site at:  http://localhost:4321
echo  Keep this window OPEN while you browse.
echo  Close it or press Ctrl+C when you are done.
echo ============================================================
echo.
start "" http://localhost:4321
call npm run dev
pause
