"""FastAPI application entry point with lifespan management."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import gateways, knx, routines, schedules, flavors
from app.services import scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("knx_control")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialise the SQLite database and scheduler. Shutdown: stop scheduler."""
    logger.info("Initialising KNX Control database…")
    await init_db()
    logger.info("Database ready.")
    scheduler.start()
    logger.info("Schedule engine started.")
    yield
    scheduler.stop()
    logger.info("KNX Control shutting down.")


app = FastAPI(
    title="KNX Control API",
    description="Multi-KNX Gateway Engine — manage, command, and monitor KNX IP gateways.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Vite dev server and any local origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers.
app.include_router(gateways.router)
app.include_router(knx.router)
app.include_router(routines.router)
app.include_router(schedules.router)
app.include_router(flavors.router)


@app.get("/", tags=["Health"])
async def health_check():
    """Simple health probe."""
    return {"status": "ok", "service": "KNX Control API"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=True,
    )
