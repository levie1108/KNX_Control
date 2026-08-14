"""Flavor switch endpoint — sends KNX bus command and calls external PMJ API."""

from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, HTTPException

from app import database as db
from app.config import settings
from app.models import FlavorSwitchRequest, FlavorSwitchResponse
from app.services import knx_service

logger = logging.getLogger("flavors")

router = APIRouter(prefix="/api/v1/flavors", tags=["Flavors"])

# Group address mapping for physical KNX buttons / flavor selection.
FLAVOR_GA_MAP: dict[str, str] = {
    "aromatic": "3/0/3",
    "menthol": "3/0/5",
    "tobacco": "3/0/8",
    "newflavor": "3/0/9",
}

# Reusable async HTTP client (connection pooling).
_client = httpx.AsyncClient(timeout=15.0)


@router.post("/switch", response_model=FlavorSwitchResponse)
async def switch_flavor(payload: FlavorSwitchRequest):
    """Switch a player's flavor by sending a KNX bus telegram and calling the PMJ API."""
    flavor_name = payload.flavor.lower().strip()
    target_ga = FLAVOR_GA_MAP.get(flavor_name)

    # 1. Send KNX command to registered gateways (Value=01 / ON)
    knx_ok = False
    if target_ga:
        gateways = await db.get_all_gateways()
        for gw in gateways:
            try:
                raw = await knx_service.execute_command(
                    gateway_ip=gw["ip"],
                    gateway_port=gw["port"],
                    group_addresses=[target_ga],
                    action="ON",
                )
                if any(r.get("success") for r in raw):
                    knx_ok = True
                    logger.info(
                        "KNX telegram sent to %s:%s GA=%s (ON)",
                        gw["ip"], gw["port"], target_ga,
                    )
            except Exception as exc:
                logger.warning(
                    "KNX command failed for gateway %s (%s): %s",
                    gw["id"], gw["ip"], exc,
                )

    # 2. Call external PMJ API
    api_ok = False
    api_detail = None

    if settings.PMJ_BASE_URL and settings.PMJ_API_KEY:
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
            api_ok = True
            api_detail = f"HTTP {resp.status_code}"
            logger.info(
                "PMJ SetFlavor API success: table=%s id=%s flavor=%s (HTTP %s)",
                payload.table, payload.id, payload.flavor, resp.status_code,
            )
        except httpx.HTTPStatusError as exc:
            logger.error("PMJ API HTTP error: %s", exc)
            api_detail = f"PMJ API error: HTTP {exc.response.status_code}"
        except httpx.RequestError as exc:
            logger.error("PMJ API network error: %s", exc)
            api_detail = f"PMJ API unreachable: {exc}"
    else:
        api_detail = "PMJ API not configured in .env"

    # Success if either KNX or API succeeded
    overall_success = knx_ok or api_ok

    if not overall_success and not knx_ok and not api_ok:
        raise HTTPException(
            status_code=502,
            detail=f"Both KNX and PMJ API failed. {api_detail or ''}".strip(),
        )

    return FlavorSwitchResponse(
        table=payload.table,
        id=payload.id,
        flavor=payload.flavor,
        group_address=target_ga,
        knx_success=knx_ok,
        api_success=api_ok,
        success=overall_success,
        detail=api_detail or ("KNX Sent" if knx_ok else "OK"),
    )

