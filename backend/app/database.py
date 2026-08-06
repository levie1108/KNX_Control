"""Async SQLite gateway & schedule registry using aiosqlite."""

from __future__ import annotations

import json
from pathlib import Path

import aiosqlite

from app.config import settings

DB_FILE = Path(__file__).resolve().parent.parent / settings.DB_PATH

_CREATE_GATEWAYS_TABLE = """
CREATE TABLE IF NOT EXISTS gateways (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    ip          TEXT NOT NULL,
    port        INTEGER NOT NULL DEFAULT 3671,
    relay_addresses  TEXT NOT NULL DEFAULT '[]',
    status_addresses TEXT NOT NULL DEFAULT '[]',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
"""

_CREATE_SCHEDULES_TABLE = """
CREATE TABLE IF NOT EXISTS schedules (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    gateway_id  TEXT NOT NULL REFERENCES gateways(id) ON DELETE CASCADE,
    action      TEXT NOT NULL CHECK(action IN ('ON','OFF')),
    time        TEXT NOT NULL,
    days        TEXT NOT NULL DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]',
    enabled     INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


async def init_db() -> None:
    """Create the gateways and schedules tables if they don't exist."""
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("PRAGMA foreign_keys = ON")
        await db.execute(_CREATE_GATEWAYS_TABLE)
        await db.execute(_CREATE_SCHEDULES_TABLE)
        await db.commit()

        # Seed default gateway if database is empty
        cursor = await db.execute("SELECT COUNT(*) FROM gateways")
        count = (await cursor.fetchone())[0]
        if count == 0:
            await db.execute(
                """
                INSERT INTO gateways (id, name, ip, port, relay_addresses, status_addresses)
                VALUES ('devtable_01', 'Dev Table 01', '192.168.10.50', 3671, '["3/0/1"]', '[]')
                """
            )
            await db.commit()


# ── Gateway helpers ──────────────────────────────────────────────


def _row_to_dict(row: aiosqlite.Row) -> dict:
    """Convert a sqlite Row to a gateway dict with parsed JSON lists."""
    return {
        "id": row["id"],
        "name": row["name"],
        "ip": row["ip"],
        "port": row["port"],
        "relay_addresses": json.loads(row["relay_addresses"]),
        "status_addresses": json.loads(row["status_addresses"]),
        "created_at": row["created_at"],
    }


async def get_all_gateways() -> list[dict]:
    """Return every registered gateway."""
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM gateways ORDER BY name") as cursor:
            return [_row_to_dict(row) async for row in cursor]


async def get_gateway(gateway_id: str) -> dict | None:
    """Return a single gateway by ID, or None."""
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM gateways WHERE id = ?", (gateway_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return _row_to_dict(row) if row else None


async def upsert_gateway(data: dict) -> dict:
    """Insert or replace a gateway record. Returns the saved row."""
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute(
            """
            INSERT INTO gateways (id, name, ip, port, relay_addresses, status_addresses)
            VALUES (:id, :name, :ip, :port, :relay_addresses, :status_addresses)
            ON CONFLICT(id) DO UPDATE SET
                name             = excluded.name,
                ip               = excluded.ip,
                port             = excluded.port,
                relay_addresses  = excluded.relay_addresses,
                status_addresses = excluded.status_addresses
            """,
            {
                "id": data["id"],
                "name": data["name"],
                "ip": data["ip"],
                "port": data["port"],
                "relay_addresses": json.dumps(data.get("relay_addresses", [])),
                "status_addresses": json.dumps(data.get("status_addresses", [])),
            },
        )
        await db.commit()
    return await get_gateway(data["id"])  # type: ignore[return-value]


async def delete_gateway(gateway_id: str) -> bool:
    """Delete a gateway and its schedules (CASCADE). Returns True if a row was removed."""
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("PRAGMA foreign_keys = ON")
        cursor = await db.execute(
            "DELETE FROM gateways WHERE id = ?", (gateway_id,)
        )
        await db.commit()
        return cursor.rowcount > 0


# ── Schedule helpers ─────────────────────────────────────────────


def _schedule_row_to_dict(row: aiosqlite.Row) -> dict:
    """Convert a sqlite Row to a schedule dict."""
    return {
        "id": row["id"],
        "gateway_id": row["gateway_id"],
        "action": row["action"],
        "time": row["time"],
        "days": json.loads(row["days"]),
        "enabled": bool(row["enabled"]),
        "created_at": row["created_at"],
    }


async def get_all_schedules() -> list[dict]:
    """Return all schedules across all gateways."""
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM schedules ORDER BY time") as cursor:
            return [_schedule_row_to_dict(row) async for row in cursor]


async def get_schedules_for_gateway(gateway_id: str) -> list[dict]:
    """Return schedules for a specific gateway plus global (ALL) schedules."""
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM schedules WHERE gateway_id = ? OR gateway_id = 'ALL' ORDER BY time",
            (gateway_id,),
        ) as cursor:
            return [_schedule_row_to_dict(row) async for row in cursor]


async def get_schedule(schedule_id: int) -> dict | None:
    """Return a single schedule by ID, or None."""
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM schedules WHERE id = ?", (schedule_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return _schedule_row_to_dict(row) if row else None


async def create_schedule(data: dict) -> dict:
    """Insert a new schedule. Returns the saved row."""
    async with aiosqlite.connect(DB_FILE) as db:
        cursor = await db.execute(
            """
            INSERT INTO schedules (gateway_id, action, time, days, enabled)
            VALUES (:gateway_id, :action, :time, :days, :enabled)
            """,
            {
                "gateway_id": data["gateway_id"],
                "action": data["action"],
                "time": data["time"],
                "days": json.dumps(data.get("days", ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])),
                "enabled": 1 if data.get("enabled", True) else 0,
            },
        )
        await db.commit()
        return await get_schedule(cursor.lastrowid)  # type: ignore[return-value]


async def update_schedule(schedule_id: int, data: dict) -> dict | None:
    """Update an existing schedule. Returns the updated row or None."""
    existing = await get_schedule(schedule_id)
    if not existing:
        return None

    merged = {**existing, **{k: v for k, v in data.items() if v is not None}}
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute(
            """
            UPDATE schedules
            SET action = :action, time = :time, days = :days, enabled = :enabled
            WHERE id = :id
            """,
            {
                "id": schedule_id,
                "action": merged["action"],
                "time": merged["time"],
                "days": json.dumps(merged["days"]) if isinstance(merged["days"], list) else merged["days"],
                "enabled": 1 if merged["enabled"] else 0,
            },
        )
        await db.commit()
    return await get_schedule(schedule_id)


async def toggle_schedule(schedule_id: int, enabled: bool) -> dict | None:
    """Enable or disable a schedule. Returns the updated row or None."""
    async with aiosqlite.connect(DB_FILE) as db:
        cursor = await db.execute(
            "UPDATE schedules SET enabled = ? WHERE id = ?",
            (1 if enabled else 0, schedule_id),
        )
        await db.commit()
        if cursor.rowcount == 0:
            return None
    return await get_schedule(schedule_id)


async def delete_schedule(schedule_id: int) -> bool:
    """Delete a schedule by ID. Returns True if a row was removed."""
    async with aiosqlite.connect(DB_FILE) as db:
        cursor = await db.execute(
            "DELETE FROM schedules WHERE id = ?", (schedule_id,)
        )
        await db.commit()
        return cursor.rowcount > 0


async def count_schedules_by_gateway() -> dict[str, int]:
    """Return a mapping of gateway_id → schedule count."""
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT gateway_id, COUNT(*) as cnt FROM schedules GROUP BY gateway_id"
        ) as cursor:
            return {row["gateway_id"]: row["cnt"] async for row in cursor}
