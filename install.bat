@echo off
REM ============================================================
REM  KNX Control — Windows Installation Script
REM  Copy-paste this entire block into PowerShell or CMD
REM ============================================================

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   KNX Control — Windows 11 Installer        ║
echo  ╚══════════════════════════════════════════════╝
echo.

REM ── 1. Check Python ──────────────────────────────────────────
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed.
    echo         Install from: https://www.python.org/downloads/
    echo         Or run:  winget install Python.Python.3.11
    exit /b 1
)
echo [OK] Python found:
python --version

REM ── 2. Check Node.js ─────────────────────────────────────────
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo         Install from: https://nodejs.org/
    echo         Or run:  winget install OpenJS.NodeJS.LTS
    exit /b 1
)
echo [OK] Node.js found:
node --version

REM ── 3. Backend Setup ─────────────────────────────────────────
echo.
echo [1/4] Setting up Python backend...
cd backend

if not exist ".venv" (
    python -m venv .venv
    echo       Created virtual environment.
)

call .venv\Scripts\activate.bat
pip install --quiet -r requirements.txt
echo [OK] Backend dependencies installed.
cd ..

REM ── 4. Frontend Setup ────────────────────────────────────────
echo.
echo [2/4] Setting up React frontend...
cd frontend
call npm install --silent
echo [OK] Frontend dependencies installed.

REM ── 5. Build frontend for production ─────────────────────────
echo.
echo [3/4] Building frontend for production...
call npm run build
echo [OK] Frontend built to frontend\dist\
cd ..

REM ── 6. Create startup script ─────────────────────────────────
echo.
echo [4/4] Creating start.bat...

(
echo @echo off
echo echo Starting KNX Control...
echo echo.
echo cd /d "%%~dp0backend"
echo call .venv\Scripts\activate.bat
echo start "KNX Backend" python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
echo cd /d "%%~dp0frontend"
echo start "KNX Frontend" npm run dev
echo echo.
echo echo  Backend:   http://localhost:8000
echo echo  Dashboard: http://localhost:5173
echo echo  Swagger:   http://localhost:8000/docs
echo echo.
echo pause
) > start.bat

echo [OK] Created start.bat

REM ── Done ─────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   Installation Complete!                     ║
echo  ║                                              ║
echo  ║   Run:  start.bat                            ║
echo  ║                                              ║
echo  ║   Backend:   http://localhost:8000            ║
echo  ║   Dashboard: http://localhost:5173            ║
echo  ║   Swagger:   http://localhost:8000/docs       ║
echo  ╚══════════════════════════════════════════════╝
echo.
