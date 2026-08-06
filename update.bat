@echo off
REM ============================================================
REM  KNX Control — Windows Update Script
REM  Pull latest code from GitHub and update dependencies & build
REM ============================================================

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   KNX Control — Windows Updater             ║
echo  ╚══════════════════════════════════════════════╝
echo.

REM ── 1. Pull latest code from GitHub ──────────────────────────
echo [1/3] Pulling latest updates from GitHub...
git pull origin main
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Git pull failed or no git repository found. Continuing local setup...
)

REM ── 2. Update Backend Virtual Environment ────────────────────
echo.
echo [2/3] Updating Python backend dependencies...
cd backend
if exist ".venv" (
    call .venv\Scripts\activate.bat
    pip install --quiet -r requirements.txt
    echo [OK] Backend dependencies updated.
) else (
    echo [ERROR] Backend .venv not found. Run install.bat first!
)
cd ..

REM ── 3. Update & Rebuild Frontend ─────────────────────────────
echo.
echo [3/3] Updating and rebuilding React frontend...
cd frontend
call npm install --silent
call npm run build
echo [OK] Frontend rebuilt to frontend\dist\
cd ..

REM ── Done ─────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   Update Complete!                           ║
echo  ║                                              ║
echo  ║   Run:  start.bat                            ║
echo  ╚══════════════════════════════════════════════╝
echo.
pause
