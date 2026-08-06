"""Core KNX service — per-request connect/command/disconnect via xknx UDP tunneling."""

from __future__ import annotations

import asyncio
import logging
import socket

from xknx import XKNX
from xknx.devices import BinarySensor, Switch
from xknx.io import ConnectionConfig, ConnectionType

logger = logging.getLogger("knx_service")

# Timeout for establishing a KNX tunneling connection (seconds).
CONNECT_TIMEOUT = 5.0

# Delay between consecutive relay commands to avoid UDP packet congestion.
INTER_COMMAND_DELAY = 0.1


def _build_connection_config(gateway_ip: str, gateway_port: int) -> ConnectionConfig:
    """Build a tunneling ConnectionConfig for the given gateway."""
    return ConnectionConfig(
        connection_type=ConnectionType.TUNNELING,
        gateway_ip=gateway_ip,
        gateway_port=gateway_port,
    )


async def execute_command(
    gateway_ip: str,
    gateway_port: int,
    group_addresses: list[str],
    action: str,
) -> list[dict]:
    """Connect to a gateway, send ON/OFF to each group address, and disconnect.

    Returns a list of per-address result dicts: {group_address, success, error}.
    """
    results: list[dict] = []
    xknx = XKNX(connection_config=_build_connection_config(gateway_ip, gateway_port))

    try:
        await asyncio.wait_for(xknx.start(), timeout=CONNECT_TIMEOUT)

        for ga in group_addresses:
            try:
                switch = Switch(
                    xknx,
                    name=f"Relay_{ga.replace('/', '_')}",
                    group_address=ga,
                )
                if action == "ON":
                    await switch.set_on()
                else:
                    await switch.set_off()
                results.append({"group_address": ga, "success": True, "error": None})
            except Exception as exc:
                logger.warning("Command failed for %s: %s", ga, exc)
                results.append({"group_address": ga, "success": False, "error": str(exc)})

            if len(group_addresses) > 1:
                await asyncio.sleep(INTER_COMMAND_DELAY)

    except asyncio.TimeoutError:
        msg = f"Timeout connecting to {gateway_ip}:{gateway_port}"
        logger.error(msg)
        for ga in group_addresses:
            if not any(r["group_address"] == ga for r in results):
                results.append({"group_address": ga, "success": False, "error": msg})
    except OSError as exc:
        msg = f"Network error connecting to {gateway_ip}:{gateway_port} — {exc}"
        logger.error(msg)
        for ga in group_addresses:
            if not any(r["group_address"] == ga for r in results):
                results.append({"group_address": ga, "success": False, "error": msg})
    finally:
        await xknx.stop()

    return results


async def read_status(
    gateway_ip: str,
    gateway_port: int,
    status_ga: str,
) -> dict:
    """Connect to a gateway, read the status of a single group address, and disconnect.

    Returns: {group_address, state: bool|None, error}.
    """
    xknx = XKNX(connection_config=_build_connection_config(gateway_ip, gateway_port))

    try:
        await asyncio.wait_for(xknx.start(), timeout=CONNECT_TIMEOUT)

        sensor = BinarySensor(
            xknx,
            name=f"status_{status_ga}",
            group_address_state=status_ga,
        )
        await sensor.sync()

        # Allow a brief window for the response telegram.
        await asyncio.sleep(0.3)

        return {
            "group_address": status_ga,
            "state": sensor.is_on() if sensor.state is not None else None,
            "error": None,
        }

    except asyncio.TimeoutError:
        msg = f"Timeout reading status from {gateway_ip}:{gateway_port}"
        logger.error(msg)
        return {"group_address": status_ga, "state": None, "error": msg}
    except OSError as exc:
        msg = f"Network error reading status — {exc}"
        logger.error(msg)
        return {"group_address": status_ga, "state": None, "error": msg}
    finally:
        await xknx.stop()


async def ping_gateway(gateway_ip: str, gateway_port: int, timeout: float = 2.0) -> bool:
    """Test if a KNX IP gateway is online and accepting tunneling connections.

    Uses a fast low-level UDP search request probe followed by an xknx connection check
    with auto_reconnect=False.
    """
    # 1. Fast low-level UDP search request probe
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(timeout)
        search_req = bytes([
            0x06, 0x10, 0x02, 0x01, 0x00, 0x0e,
            0x08, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ])
        sock.sendto(search_req, (gateway_ip, gateway_port))
        data, _ = sock.recvfrom(512)
        sock.close()
        if len(data) >= 6 and data[0] == 0x06 and data[1] == 0x10:
            return True
    except Exception:
        pass

    # 2. Strict xknx connection check without auto_reconnect
    connection_config = ConnectionConfig(
        connection_type=ConnectionType.TUNNELING,
        gateway_ip=gateway_ip,
        gateway_port=gateway_port,
        auto_reconnect=False,
    )
    xknx = XKNX(connection_config=connection_config)
    try:
        await asyncio.wait_for(xknx.start(), timeout=timeout)
        is_connected = (
            xknx.knxip_interface is not None
            and getattr(xknx.knxip_interface, "connected", False)
        )
        await xknx.stop()
        return is_connected
    except Exception as exc:
        logger.debug("Gateway %s:%d ping failed: %s", gateway_ip, gateway_port, exc)
        try:
            await xknx.stop()
        except Exception:
            pass
        return False

