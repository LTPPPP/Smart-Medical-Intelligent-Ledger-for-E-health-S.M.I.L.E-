from __future__ import annotations

import asyncio
import time
from copy import deepcopy
from dataclasses import dataclass, replace
from typing import Any, Callable, Literal, Protocol

from .schemas import FlowName


ConfirmationConsumeStatus = Literal[
    "consumed",
    "invalid",
    "expired",
    "superseded",
    "replayed",
    "scope_mismatch",
]


@dataclass(frozen=True)
class PendingConfirmation:
    token: str
    session_id: str
    patient_id: str | None
    flow: FlowName
    action: str
    payload: dict[str, Any]
    summary: str


@dataclass(frozen=True)
class ConfirmationConsumeResult:
    status: ConfirmationConsumeStatus
    confirmation: PendingConfirmation | None = None


class ConfirmationStore(Protocol):
    async def create(self, confirmation: PendingConfirmation) -> None: ...

    async def consume(
        self,
        token: str,
        *,
        session_id: str,
        patient_id: str | None,
    ) -> ConfirmationConsumeResult: ...


@dataclass(frozen=True)
class _StoredConfirmation:
    confirmation: PendingConfirmation
    expires_at: float


@dataclass(frozen=True)
class _Tombstone:
    status: Literal["expired", "superseded", "replayed"]
    expires_at: float


class InMemoryConfirmationStore:
    def __init__(
        self,
        *,
        ttl_seconds: float = 900,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be positive")
        self.ttl_seconds = ttl_seconds
        self._clock = clock
        self._items: dict[str, _StoredConfirmation] = {}
        self._tombstones: dict[str, _Tombstone] = {}
        self._lock = asyncio.Lock()

    async def create(self, confirmation: PendingConfirmation) -> None:
        now = self._clock()
        async with self._lock:
            self._purge_tombstones(now)
            for token, stored in list(self._items.items()):
                if stored.expires_at <= now:
                    self._items.pop(token, None)
                    self._remember(token, "expired", now)
                elif stored.confirmation.session_id == confirmation.session_id:
                    self._items.pop(token, None)
                    self._remember(token, "superseded", now)
            copied = replace(confirmation, payload=deepcopy(confirmation.payload))
            self._items[confirmation.token] = _StoredConfirmation(
                confirmation=copied,
                expires_at=now + self.ttl_seconds,
            )

    async def consume(
        self,
        token: str,
        *,
        session_id: str,
        patient_id: str | None,
    ) -> ConfirmationConsumeResult:
        now = self._clock()
        async with self._lock:
            self._purge_tombstones(now)
            stored = self._items.pop(token, None)
            if stored is None:
                tombstone = self._tombstones.get(token)
                return ConfirmationConsumeResult(status=tombstone.status if tombstone else "invalid")
            if stored.expires_at <= now:
                self._remember(token, "expired", now)
                return ConfirmationConsumeResult(status="expired")
            if (
                stored.confirmation.session_id != session_id
                or stored.confirmation.patient_id != patient_id
            ):
                self._remember(token, "replayed", now)
                return ConfirmationConsumeResult(status="scope_mismatch")
            self._remember(token, "replayed", now)
            copied = replace(stored.confirmation, payload=deepcopy(stored.confirmation.payload))
            return ConfirmationConsumeResult(status="consumed", confirmation=copied)

    def _remember(
        self,
        token: str,
        status: Literal["expired", "superseded", "replayed"],
        now: float,
    ) -> None:
        self._tombstones[token] = _Tombstone(status=status, expires_at=now + self.ttl_seconds)

    def _purge_tombstones(self, now: float) -> None:
        for token, tombstone in list(self._tombstones.items()):
            if tombstone.expires_at <= now:
                self._tombstones.pop(token, None)
