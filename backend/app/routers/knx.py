"""KNX command and status endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app import database as db
from app.models import (
    KnxCommandRequest,
    KnxCommandResponse,
    KnxCommandResult,
    KnxStatusRequest,
    KnxStatusResponse,
)
from app.services import knx_service

router = APIRouter(prefix="/api/v1/knx", tags=["KNX Control"])


@router.post("/command", response_model=KnxCommandResponse)
async def send_command(payload: KnxCommandRequest):
    """Send ON/OFF commands to one or more group addresses on a gateway."""
    gw = await db.get_gateway(payload.gateway_id)
    if gw is None:
        raise HTTPException(
            status_code=404,
            detail=f"Gateway '{payload.gateway_id}' not found",
        )

    raw_results = await knx_service.execute_command(
        gateway_ip=gw["ip"],
        gateway_port=gw["port"],
        group_addresses=payload.group_addresses,
        action=payload.action,
    )

    return KnxCommandResponse(
        gateway_id=payload.gateway_id,
        action=payload.action,
        results=[KnxCommandResult(**r) for r in raw_results],
    )


@router.post("/status", response_model=KnxStatusResponse)
async def read_status(payload: KnxStatusRequest):
    """Read the live status of a single group address via GroupValueRead."""
    gw = await db.get_gateway(payload.gateway_id)
    if gw is None:
        raise HTTPException(
            status_code=404,
            detail=f"Gateway '{payload.gateway_id}' not found",
        )

    result = await knx_service.read_status(
        gateway_ip=gw["ip"],
        gateway_port=gw["port"],
        status_ga=payload.status_ga,
    )

    return KnxStatusResponse(gateway_id=payload.gateway_id, **result)
