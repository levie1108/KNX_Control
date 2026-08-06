#!/usr/bin/env bash
# ============================================================
#  KNX Control — Linux / macOS Update Script
#  Pull latest code from GitHub and update dependencies & build
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   KNX Control — Linux/macOS Updater          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Pull latest code from GitHub ──────────────────────────
echo "[1/3] Pulling latest updates from GitHub..."
git pull origin main || echo "[WARNING] Git pull had issues. Continuing..."

# ── 2. Update Backend Virtual Environment ────────────────────
echo ""
echo "[2/3] Updating Python backend dependencies..."
cd backend
if [ -d ".venv" ]; then
    source .venv/bin/activate
    pip install --quiet -r requirements.txt
    echo "[OK] Backend dependencies updated."
else
    echo "[ERROR] Backend .venv not found. Run ./install.sh first!"
    exit 1
fi
cd ..

# ── 3. Update & Rebuild Frontend ─────────────────────────────
echo ""
echo "[3/3] Updating and rebuilding React frontend..."
cd frontend
npm install --silent
npm run build
echo "[OK] Frontend rebuilt to frontend/dist/"
cd ..

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Update Complete!                           ║"
echo "║                                              ║"
echo "║   Run:  ./start.sh                           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
