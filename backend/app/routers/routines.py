"""Master routine endpoints — bulk power-up and shutdown across all gateways."""

from __future__ import annotations

import logging

from fastapi import APIRouter

from app import database as db
from app.models import RoutineGatewayResult, RoutineResponse
from app.services import knx_service

logger = logging.getLogger("routines")

router = APIRouter(prefix="/api/v1/routines", tags=["Routines"])


async def _bulk_action(action: str) -> RoutineResponse:
    """Execute ON or OFF across every relay on every registered gateway."""
    gateways = await db.get_all_gateways()
    results: list[RoutineGatewayResult] = []

    for gw in gateways:
        relay_addrs = gw.get("relay_addresses", [])
        if not relay_addrs:
            results.append(
                RoutineGatewayResult(
                    gateway_id=gw["id"],
                    success=True,
                    relays_affected=0,
                    error=None,
                )
            )
            continue

        try:
            raw = await knx_service.execute_command(
                gateway_ip=gw["ip"],
                gateway_port=gw["port"],
                group_addresses=relay_addrs,
                action=action,
            )
            failures = [r for r in raw if not r["success"]]
            if failures:
                results.append(
                    RoutineGatewayResult(
                        gateway_id=gw["id"],
                        success=False,
                        relays_affected=len(raw) - len(failures),
                        error=f"{len(failures)} relay(s) failed",
                    )
                )
            else:
                results.append(
                    RoutineGatewayResult(
                        gateway_id=gw["id"],
                        success=True,
                        relays_affected=len(raw),
                    )
                )
        except Exception as exc:
            logger.error("Routine %s failed for gateway %s: %s", action, gw["id"], exc)
            results.append(
                RoutineGatewayResult(
                    gateway_id=gw["id"],
                    success=False,
                    error=str(exc),
                )
            )

    return RoutineResponse(
        action=action,
        results=results,
        total_gateways=len(gateways),
        total_errors=sum(1 for r in results if not r.success),
    )


@router.post("/shutdown-all", response_model=RoutineResponse)
async def shutdown_all():
    """Turn OFF all relays across every registered gateway."""
    return await _bulk_action("OFF")


@router.post("/powerup-all", response_model=RoutineResponse)
async def powerup_all():
    """Turn ON all relays across every registered gateway."""
    return await _bulk_action("ON")
