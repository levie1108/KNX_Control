"""Schedule CRUD endpoints — per-gateway scheduled power-on and shutdown."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app import database as db
from app.models import (
    ScheduleCreate,
    ScheduleResponse,
    ScheduleToggle,
    ScheduleUpdate,
)
from app.services import scheduler

logger = logging.getLogger("schedules")

router = APIRouter(prefix="/api/v1/schedules", tags=["Schedules"])


@router.get("", response_model=list[ScheduleResponse])
async def list_schedules(gateway_id: Optional[str] = Query(default=None)):
    """List schedules, optionally filtered by gateway_id."""
    if gateway_id:
        return await db.get_schedules_for_gateway(gateway_id)
    return await db.get_all_schedules()


@router.post("", response_model=ScheduleResponse, status_code=201)
async def create_schedule(payload: ScheduleCreate):
    """Create a new schedule for a specific gateway or ALL gateways (global)."""
    if payload.gateway_id != "ALL":
        gw = await db.get_gateway(payload.gateway_id)
        if gw is None:
            raise HTTPException(
                status_code=404,
                detail=f"Gateway '{payload.gateway_id}' not found",
            )

    result = await db.create_schedule(payload.model_dump())
    await scheduler.reload_schedules()
    logger.info(
        "Created schedule %d: %s at %s for target '%s'",
        result["id"],
        result["action"],
        result["time"],
        result["gateway_id"],
    )
    return result


@router.put("/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(schedule_id: int, payload: ScheduleUpdate):
    """Update an existing schedule."""
    result = await db.update_schedule(schedule_id, payload.model_dump(exclude_unset=True))
    if result is None:
        raise HTTPException(status_code=404, detail=f"Schedule {schedule_id} not found")
    await scheduler.reload_schedules()
    return result


@router.patch("/{schedule_id}/toggle", response_model=ScheduleResponse)
async def toggle_schedule(schedule_id: int, payload: ScheduleToggle):
    """Enable or disable a schedule."""
    result = await db.toggle_schedule(schedule_id, payload.enabled)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Schedule {schedule_id} not found")
    await scheduler.reload_schedules()
    logger.info("Schedule %d %s.", schedule_id, "enabled" if payload.enabled else "disabled")
    return result


@router.delete("/{schedule_id}", status_code=204)
async def delete_schedule(schedule_id: int):
    """Delete a schedule."""
    removed = await db.delete_schedule(schedule_id)
    if not removed:
        raise HTTPException(status_code=404, detail=f"Schedule {schedule_id} not found")
    await scheduler.reload_schedules()
    logger.info("Deleted schedule %d.", schedule_id)


@router.get("/counts", response_model=dict[str, int])
async def schedule_counts():
    """Return schedule counts grouped by gateway_id."""
    return await db.count_schedules_by_gateway()
