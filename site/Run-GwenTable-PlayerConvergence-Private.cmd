@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found. Install official Node.js 26 from https://nodejs.org/en/download
  pause
  exit /b 1
)
echo GwenTable PRIVATE Player Convergence Preview, dev.6-derived source.
echo Artwork is withheld. Do not use production characters. Not a public release.
node --version
echo Open the loopback URL shown by the server, normally http://127.0.0.1:4174/
call npm run dev:artwork-withheld-preview
if errorlevel 1 pause
endlocal
