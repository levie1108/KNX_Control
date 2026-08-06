"""Gateway registry CRUD endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app import database as db
from app.models import GatewayCreate, GatewayResponse

router = APIRouter(prefix="/api/v1/gateways", tags=["Gateways"])


@router.get("", response_model=list[GatewayResponse])
async def list_gateways():
    """List all registered KNX gateways."""
    return await db.get_all_gateways()


@router.post("", response_model=GatewayResponse, status_code=201)
async def upsert_gateway(payload: GatewayCreate):
    """Add or update a KNX gateway registration."""
    result = await db.upsert_gateway(payload.model_dump())
    return result


@router.get("/{gateway_id}", response_model=GatewayResponse)
async def get_gateway(gateway_id: str):
    """Get a single gateway by ID."""
    gw = await db.get_gateway(gateway_id)
    if gw is None:
        raise HTTPException(status_code=404, detail=f"Gateway '{gateway_id}' not found")
    return gw


@router.delete("/{gateway_id}", status_code=204)
async def delete_gateway(gateway_id: str):
    """Remove a gateway from the registry."""
    removed = await db.delete_gateway(gateway_id)
    if not removed:
        raise HTTPException(status_code=404, detail=f"Gateway '{gateway_id}' not found")
