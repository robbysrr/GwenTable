@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
 echo Install official Node.js before running this preview.
 pause
 exit /b 1
)
set PORT=42629
echo Private Integration 03 QA only. Use synthetic characters in a test browser profile.
echo Open http://127.0.0.1:42629/ after the server starts.
call npm run dev:artwork-withheld-preview
if errorlevel 1 pause
endlocal
