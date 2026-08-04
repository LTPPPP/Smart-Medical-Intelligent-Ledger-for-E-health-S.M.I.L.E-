"""Bot account login."""

from __future__ import annotations

import time

import httpx

from ...config import get_settings

_cached_token: str | None = None
_cached_expires_at: float = 0.0
# Refresh before expiry
_EXPIRY_SAFETY_MARGIN_SECONDS = 60


async def get_bot_token() -> str:
    global _cached_token, _cached_expires_at
    if _cached_token and time.time() < _cached_expires_at:
        return _cached_token

    settings = get_settings()
    async with httpx.AsyncClient(base_url=settings.iam_service_url, timeout=10) as client:
        response = await client.post(
            "/v1/auth/email/login",
            json={
                "email": settings.bot_account_email,
                "password": settings.bot_account_password,
            },
        )
        response.raise_for_status()
        data = response.json()

    _cached_token = data["token"]
    token_expires_ms = data.get("tokenExpires")
    if token_expires_ms:
        _cached_expires_at = (token_expires_ms / 1000) - _EXPIRY_SAFETY_MARGIN_SECONDS
    else:
        _cached_expires_at = time.time() + 300
    return _cached_token
