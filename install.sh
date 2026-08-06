#!/usr/bin/env bash
# ============================================================
#  KNX Control — Linux / macOS Installation Script
#  Copy-paste this entire block into your terminal
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   KNX Control — Linux/macOS Installer        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Check Python ──────────────────────────────────────────
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed."
    echo "        Ubuntu/Debian: sudo apt install python3 python3-venv python3-pip"
    echo "        Fedora/RHEL:   sudo dnf install python3 python3-pip"
    echo "        macOS:         brew install python3"
    exit 1
fi
echo "[OK] Python found: $(python3 --version)"

# ── 2. Check Node.js ─────────────────────────────────────────
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed."
    echo "        Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt install -y nodejs"
    echo "        Fedora/RHEL:   sudo dnf install nodejs"
    echo "        macOS:         brew install node"
    exit 1
fi
echo "[OK] Node.js found: $(node --version)"

# ── 3. Backend Setup ─────────────────────────────────────────
echo ""
echo "[1/4] Setting up Python backend..."
cd backend

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "      Created virtual environment."
fi

source .venv/bin/activate
pip install --quiet -r requirements.txt
echo "[OK] Backend dependencies installed."
cd ..

# ── 4. Frontend Setup ────────────────────────────────────────
echo ""
echo "[2/4] Setting up React frontend..."
cd frontend
npm install --silent
echo "[OK] Frontend dependencies installed."

# ── 5. Build frontend for production ─────────────────────────
echo ""
echo "[3/4] Building frontend for production..."
npm run build
echo "[OK] Frontend built to frontend/dist/"
cd ..

# ── 6. Create startup script ─────────────────────────────────
echo ""
echo "[4/4] Creating start.sh..."

cat > start.sh << 'STARTUP'
#!/usr/bin/env bash
# KNX Control — Startup Script
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting KNX Control..."
echo ""

# Start backend
cd "$SCRIPT_DIR/backend"
source .venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend dev server
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Backend:   http://localhost:8000"
echo "  Dashboard: http://localhost:5173"
echo "  Swagger:   http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo ""

# Trap Ctrl+C to kill both
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'; exit 0" SIGINT SIGTERM

wait
STARTUP

chmod +x start.sh
echo "[OK] Created start.sh"

# ── 7. Open firewall for KNX UDP (optional) ──────────────────
echo ""
echo "[TIP] If you need KNX gateway access, open UDP port 3671:"
echo "      Ubuntu:  sudo ufw allow 3671/udp"
echo "      Fedora:  sudo firewall-cmd --add-port=3671/udp --permanent && sudo firewall-cmd --reload"
echo ""

# ── Done ─────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════╗"
echo "║   Installation Complete!                     ║"
echo "║                                              ║"
echo "║   Run:  ./start.sh                           ║"
echo "║                                              ║"
echo "║   Backend:   http://localhost:8000            ║"
echo "║   Dashboard: http://localhost:5173            ║"
echo "║   Swagger:   http://localhost:8000/docs       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
