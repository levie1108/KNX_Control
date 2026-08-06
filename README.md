# KNX Control — Multi-Gateway Engine & Dashboard

A **FastAPI + React** application for managing, commanding, scheduling, and monitoring multiple KNX IP gateways via UDP tunneling.

## Architecture

```
Backend (Python)          Frontend (React + Vite)
┌──────────────────┐     ┌──────────────────────┐
│  FastAPI + xknx  │◄────│  SPA Control Panel   │
│  SQLite Registry │     │  Tailwind Dark Theme  │
│  Async Scheduler │     │  Glassmorphism UI     │
└──────────────────┘     └──────────────────────┘
        │
        ▼ UDP Tunneling
  ┌─────────────┐
  │ KNX Gateway │ ×N
  └─────────────┘
```

## One-Click Installation

### Windows (Windows 11 / Windows Server)

Open Command Prompt or PowerShell in the project directory and run:

```cmd
install.bat
```

To start the application anytime afterwards:
```cmd
start.bat
```

---

### Linux Server (Ubuntu / Debian / RHEL / macOS)

Open terminal in the project directory and run:

```bash
chmod +x install.sh && ./install.sh
```

To start the application anytime afterwards:
```bash
./start.sh
```

---

## Manual Quick Start

### Backend

```bash
cd backend
python -m venv .venv
# On Windows: .venv\Scripts\activate
# On Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Dashboard: http://localhost:5173

> The Vite dev server proxies `/api/*` requests to `localhost:8000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/gateways` | List all gateways |
| POST | `/api/v1/gateways` | Add/update a gateway |
| GET | `/api/v1/gateways/{id}` | Get gateway by ID |
| DELETE | `/api/v1/gateways/{id}` | Remove a gateway |
| POST | `/api/v1/knx/command` | Send ON/OFF to group addresses |
| POST | `/api/v1/knx/status` | Read status of a group address |
| POST | `/api/v1/routines/shutdown-all` | OFF all relays, all gateways |
| POST | `/api/v1/routines/powerup-all` | ON all relays, all gateways |
| GET | `/api/v1/schedules` | List all scheduled events |
| POST | `/api/v1/schedules` | Create a per-gateway schedule |
| PUT | `/api/v1/schedules/{id}` | Update a schedule |
| PATCH | `/api/v1/schedules/{id}/toggle` | Enable/disable a schedule |
| DELETE | `/api/v1/schedules/{id}` | Remove a schedule |
| GET | `/api/v1/schedules/counts` | Get schedule counts per gateway |

## Configuration

Edit `backend/.env`:

```env
APP_HOST=0.0.0.0
APP_PORT=8000
DEFAULT_KNX_PORT=3671
DB_PATH=knx_registry.db
```

## Tech Stack

- **Backend:** Python 3.10+, FastAPI, xknx, aiosqlite, Pydantic v2
- **Frontend:** React 18, Vite, Tailwind CSS 3, Lucide React
- **Protocol:** KNX/IP UDP Tunneling (port 3671)
- **Database:** SQLite (auto-created, zero config)
- **Scheduler:** Zero-dependency async background task

