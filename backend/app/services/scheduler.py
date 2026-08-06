"""Async in-process scheduler — polls every 30s and fires ON/OFF commands at scheduled times."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime

from app import database as db
from app.services import knx_service

logger = logging.getLogger("scheduler")

# How often we check if any schedule should fire (seconds).
POLL_INTERVAL = 30

# Track which (schedule_id, HH:MM) pairs already fired this minute
# to avoid duplicate execution within the same minute window.
_fired_this_minute: set[tuple[int, str]] = set()

_task: asyncio.Task | None = None


async def _execute_schedule(schedule: dict) -> None:
    """Fire a schedule: send ON/OFF commands to a target gateway or ALL gateways (global)."""
    action = schedule["action"]
    target_id = schedule["gateway_id"]

    if target_id == "ALL":
        gateways = await db.get_all_gateways()
        logger.info(
            "⏰ Global Schedule %d firing: %s across all %d registered gateway(s)",
            schedule["id"],
            action,
            len(gateways),
        )
        for gw in gateways:
            relay_addrs = gw.get("relay_addresses", [])
            if not relay_addrs:
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
                    logger.warning(
                        "Global Schedule %d: %d/%d relays failed on gateway '%s'.",
                        schedule["id"],
                        len(failures),
                        len(raw),
                        gw["id"],
                    )
                else:
                    logger.info(
                        "Global Schedule %d: all %d relays %s on gateway '%s'.",
                        schedule["id"],
                        len(raw),
                        action,
                        gw["id"],
                    )
            except Exception as exc:
                logger.error(
                    "Global Schedule %d execution error on gateway '%s': %s",
                    schedule["id"],
                    gw["id"],
                    exc,
                )
        return

    # Single gateway schedule
    gw = await db.get_gateway(target_id)
    if gw is None:
        logger.warning(
            "Schedule %d references missing gateway '%s' — skipping.",
            schedule["id"],
            target_id,
        )
        return

    relay_addrs = gw.get("relay_addresses", [])
    if not relay_addrs:
        logger.info(
            "Schedule %d fired but gateway '%s' has no relay addresses.",
            schedule["id"],
            gw["id"],
        )
        return

    logger.info(
        "⏰ Gateway Schedule %d firing: %s on gateway '%s' (%d relays)",
        schedule["id"],
        action,
        gw["id"],
        len(relay_addrs),
    )

    try:
        results = await knx_service.execute_command(
            gateway_ip=gw["ip"],
            gateway_port=gw["port"],
            group_addresses=relay_addrs,
            action=action,
        )
        failures = [r for r in results if not r["success"]]
        if failures:
            logger.warning(
                "Schedule %d: %d/%d relays failed on gateway '%s'.",
                schedule["id"],
                len(failures),
                len(results),
                gw["id"],
            )
        else:
            logger.info(
                "Schedule %d: all %d relays %s on gateway '%s'.",
                schedule["id"],
                len(results),
                action,
                gw["id"],
            )
    except Exception as exc:
        logger.error(
            "Schedule %d execution error on gateway '%s': %s",
            schedule["id"],
            gw["id"],
            exc,
        )


# Map Python's weekday() (0=Mon) to our abbreviations.
_WEEKDAY_MAP = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


async def _poll_loop() -> None:
    """Main polling loop — runs forever, checking schedules every POLL_INTERVAL seconds."""
    global _fired_this_minute

    logger.info("Scheduler started (poll every %ds).", POLL_INTERVAL)

    while True:
        try:
            now = datetime.now()
            current_time = now.strftime("%H:%M")
            current_day = _WEEKDAY_MAP[now.weekday()]

            # Reset the fired set when the minute changes.
            new_fired: set[tuple[int, str]] = set()

            schedules = await db.get_all_schedules()
            for sched in schedules:
                if not sched["enabled"]:
                    continue

                key = (sched["id"], current_time)

                if sched["time"] != current_time:
                    continue

                if current_day not in sched["days"]:
                    continue

                if key in _fired_this_minute:
                    continue

                # Fire the schedule and mark it.
                new_fired.add(key)
                asyncio.create_task(_execute_schedule(sched))

            # Keep only entries for the current minute.
            _fired_this_minute = {
                k for k in (_fired_this_minute | new_fired) if k[1] == current_time
            }

        except asyncio.CancelledError:
            logger.info("Scheduler cancelled.")
            raise
        except Exception as exc:
            logger.error("Scheduler poll error: %s", exc)

        await asyncio.sleep(POLL_INTERVAL)


def start() -> None:
    """Start the scheduler background task. Safe to call multiple times."""
    global _task
    if _task is not None and not _task.done():
        logger.debug("Scheduler already running.")
        return
    _task = asyncio.create_task(_poll_loop())


def stop() -> None:
    """Cancel the scheduler background task."""
    global _task
    if _task is not None and not _task.done():
        _task.cancel()
        logger.info("Scheduler stop requested.")
    _task = None


async def reload_schedules() -> None:
    """Signal that schedules have changed.

    Currently a no-op because the poll loop re-reads from the DB each cycle.
    Provided as an explicit hook in case we add caching later.
    """
    logger.debug("Schedule reload signalled (DB will be re-read on next poll).")
