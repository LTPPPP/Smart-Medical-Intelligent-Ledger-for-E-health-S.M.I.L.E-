from __future__ import annotations

import asyncio
from dataclasses import dataclass


@dataclass
class LockLease:
    lock: "InMemorySessionLock"
    session_id: str
    acquired: bool

    async def release(self) -> None:
        if self.acquired:
            await self.lock.release(self.session_id)


class InMemorySessionLock:
    def __init__(self, ttl_seconds: int) -> None:
        self.ttl_seconds = ttl_seconds
        self._guard = asyncio.Lock()
        self._locked: set[str] = set()

    async def acquire(self, session_id: str) -> LockLease:
        async with self._guard:
            if session_id in self._locked:
                return LockLease(self, session_id, False)
            self._locked.add(session_id)
            return LockLease(self, session_id, True)

    async def release(self, session_id: str) -> None:
        async with self._guard:
            self._locked.discard(session_id)
