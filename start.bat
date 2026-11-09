@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Get it from https://nodejs.org then run this again. & pause & exit /b)
if exist .env (findstr /b /c:"DATABASE_URL=" .env >nul && if not exist node_modules\pg call npm install)
echo Starting Storybook School... open http://localhost:3000
node --no-warnings server.js
pause
