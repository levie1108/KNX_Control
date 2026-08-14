"""Flavor switch endpoint — proxies to the external PMJ API."""

from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models import FlavorSwitchRequest, FlavorSwitchResponse

logger = logging.getLogger("flavors")

router = APIRouter(prefix="/api/v1/flavors", tags=["Flavors"])

# Reusable async HTTP client (connection pooling).
_client = httpx.AsyncClient(timeout=15.0)


@router.post("/switch", response_model=FlavorSwitchResponse)
async def switch_flavor(payload: FlavorSwitchRequest):
    """Switch a player's flavor by calling the PMJ set_flavor API."""
    if not settings.PMJ_BASE_URL or not settings.PMJ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="PMJ API not configured (check PMJ_BASE_URL / PMJ_API_KEY in .env)",
        )

    base_url = settings.PMJ_BASE_URL.strip().rstrip("/")
    if not base_url.startswith(("http://", "https://")):
        base_url = f"https://{base_url}"

    url = (
        f"{base_url}"
        f"/player/{payload.table}/{payload.id}"
        f"/set_flavor/{payload.flavor}.json"
    )


    try:
        resp = await _client.post(
            url,
            params={"api_key": settings.PMJ_API_KEY},
        )
        resp.raise_for_status()
        logger.info(
            "Flavor switched: table=%s id=%s flavor=%s (HTTP %s)",
            payload.table, payload.id, payload.flavor, resp.status_code,
        )
        return FlavorSwitchResponse(
            table=payload.table,
            id=payload.id,
            flavor=payload.flavor,
            success=True,
            detail=f"HTTP {resp.status_code}",
        )
    except httpx.HTTPStatusError as exc:
        logger.error("PMJ API error: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"PMJ API returned {exc.response.status_code}",
        )
    except httpx.RequestError as exc:
        logger.error("PMJ API request failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Could not reach PMJ API: {exc}",
        )
