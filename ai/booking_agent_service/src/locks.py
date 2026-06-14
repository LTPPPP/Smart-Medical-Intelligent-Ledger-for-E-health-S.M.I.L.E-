from __future__ import annotations

import asyncio
from dataclasses import dataclass
from uuid import uuid4


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


@dataclass
class RedisLockLease:
    redis: object
    key: str
    token: str
    acquired: bool

    async def release(self) -> None:
        if not self.acquired:
            return
        current = await self.redis.get(self.key)
        if isinstance(current, bytes):
            current = current.decode()
        if current == self.token:
            await self.redis.delete(self.key)


class RedisSessionLock:
    def __init__(
        self,
        redis_client: object,
        ttl_seconds: int,
        key_prefix: str = "booking-agent:session-lock",
    ) -> None:
        self.redis = redis_client
        self.ttl_seconds = ttl_seconds
        self.key_prefix = key_prefix

    async def acquire(self, session_id: str) -> RedisLockLease:
        key = f"{self.key_prefix}:{session_id}"
        token = str(uuid4())
        acquired = bool(
            await self.redis.set(key, token, nx=True, ex=self.ttl_seconds)
        )
        return RedisLockLease(self.redis, key, token, acquired)
