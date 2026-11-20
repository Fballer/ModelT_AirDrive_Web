@echo off
rem ============================================================================
rem Porta MT: AirDrive - Self-Hosted Local Web Server (Windows)
rem ============================================================================
rem
rem Web Bluetooth API is blocked by Chrome/Edge on file:// URLs for security.
rem This script starts a local web server at http://localhost:8080 and opens it.
rem ============================================================================

cd /d "%~dp0"
set PORT=8080
set URL=http://localhost:%PORT%/airdrive.html

echo ==========================================================
echo  Starting Porta MT: AirDrive Self-Hosted Server
echo  URL: %URL%
echo ==========================================================
echo Note: To exit, close this command prompt window.
echo.

start "" "%URL%"

where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    python -m http.server %PORT%
    goto end
)

where py >nul 2>&1
if %ERRORLEVEL% equ 0 (
    py -m http.server %PORT%
    goto end
)

echo Error: Python is required to run the local HTTP server.
echo Please install Python (python.org) or serve this folder with any web server.
pause

:end
