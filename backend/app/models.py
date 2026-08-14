"""Pydantic v2 schemas for API request/response models."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ── Gateway Registry ──────────────────────────────────────────────


class GatewayCreate(BaseModel):
    """Payload to register or update a KNX gateway."""

    id: str = Field(..., min_length=1, examples=["devtable_01"])
    name: str = Field(..., min_length=1, examples=["Dev Table 1"])
    ip: str = Field(..., examples=["192.168.1.10"])
    port: int = Field(default=3671, ge=1, le=65535)
    relay_addresses: list[str] = Field(
        default_factory=list,
        examples=[["3/0/1", "3/0/2", "3/0/3"]],
        description="Group addresses for relay ON/OFF commands",
    )
    status_addresses: list[str] = Field(
        default_factory=list,
        examples=[["3/0/9", "3/0/10", "3/0/11"]],
        description="Group addresses for status feedback (read)",
    )


class GatewayResponse(GatewayCreate):
    """Gateway data returned from the registry."""

    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ── KNX Command / Status ─────────────────────────────────────────


class KnxCommandRequest(BaseModel):
    """Send ON or OFF to one or more group addresses on a gateway."""

    gateway_id: str = Field(..., examples=["devtable_01"])
    group_addresses: list[str] = Field(..., min_length=1, examples=[["3/0/1"]])
    action: Literal["ON", "OFF"]


class KnxCommandResult(BaseModel):
    """Result for a single group address command."""

    group_address: str
    success: bool
    error: str | None = None


class KnxCommandResponse(BaseModel):
    """Aggregate response for a command batch."""

    gateway_id: str
    action: str
    results: list[KnxCommandResult]


class KnxStatusRequest(BaseModel):
    """Read the live status of a single group address."""

    gateway_id: str = Field(..., examples=["devtable_01"])
    status_ga: str = Field(..., examples=["3/0/9"])


class KnxStatusResponse(BaseModel):
    """Status read result."""

    gateway_id: str
    group_address: str
    state: bool | None = None
    error: str | None = None


# ── Routines ──────────────────────────────────────────────────────


class RoutineGatewayResult(BaseModel):
    """Per-gateway result in a bulk routine."""

    gateway_id: str
    success: bool
    relays_affected: int = 0
    error: str | None = None


class RoutineResponse(BaseModel):
    """Aggregate response for bulk power-up or shutdown routines."""

    action: str
    results: list[RoutineGatewayResult]
    total_gateways: int
    total_errors: int


# ── Schedules ─────────────────────────────────────────────────────

ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


class ScheduleCreate(BaseModel):
    """Payload to create a new per-gateway schedule."""

    gateway_id: str = Field(..., examples=["devtable_01"])
    action: Literal["ON", "OFF"]
    time: str = Field(
        ...,
        pattern=r"^([01]\d|2[0-3]):[0-5]\d$",
        examples=["08:00", "18:30"],
        description="HH:MM in 24-hour format",
    )
    days: list[str] = Field(
        default=ALL_DAYS,
        examples=[["Mon", "Tue", "Wed", "Thu", "Fri"]],
        description="Day abbreviations when the schedule is active",
    )
    enabled: bool = True


class ScheduleUpdate(BaseModel):
    """Payload to update an existing schedule. All fields optional."""

    action: Literal["ON", "OFF"] | None = None
    time: str | None = Field(
        default=None,
        pattern=r"^([01]\d|2[0-3]):[0-5]\d$",
    )
    days: list[str] | None = None
    enabled: bool | None = None


class ScheduleToggle(BaseModel):
    """Payload to enable or disable a schedule."""

    enabled: bool


class ScheduleResponse(BaseModel):
    """Schedule data returned from the registry."""

    id: int
    gateway_id: str
    action: str
    time: str
    days: list[str]
    enabled: bool
    created_at: str


# ── Flavor Switch ─────────────────────────────────────────────────


class FlavorSwitchRequest(BaseModel):
    """Payload to switch flavor via PMJ API."""

    table: int = Field(..., ge=1, le=4, description="Table number (1–4)")
    id: str = Field(..., pattern=r"^[AB]$", description="Player ID (A or B)")
    flavor: str = Field(
        ...,
        description="Flavor name: aromatic, menthol, tobacco, or newflavor",
    )


class FlavorSwitchResponse(BaseModel):
    """Response after switching flavor with KNX bus command and PMJ API."""

    table: int
    id: str
    flavor: str
    group_address: str | None = None
    knx_success: bool = False
    api_success: bool = False
    success: bool
    detail: str | None = None



