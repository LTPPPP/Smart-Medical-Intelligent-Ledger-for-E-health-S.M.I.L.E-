"""Resolve actor JWT for chat turn."""

from __future__ import annotations

from dataclasses import dataclass

import jwt

from .backend_clients.iam_client import get_bot_token
from ..config import get_settings


@dataclass(frozen=True)
class ActorContext:
    token: str
    account_id: str
    role: str | None
    is_guest: bool


def _decode_account_id(token: str) -> tuple[str, str | None]:
    settings = get_settings()
    payload = jwt.decode(
        token,
        settings.auth_jwt_secret,
        algorithms=["HS256"],
        options={"verify_exp": True},
    )
    return payload["accountId"], payload.get("role")


async def resolve_actor(authorization_header: str | None) -> ActorContext:
    if authorization_header:
        token = authorization_header.removeprefix("Bearer ").strip()
        account_id, role = _decode_account_id(token)
        return ActorContext(token=token, account_id=account_id, role=role, is_guest=False)

    bot_token = await get_bot_token()
    account_id, role = _decode_account_id(bot_token)
    return ActorContext(token=bot_token, account_id=account_id, role=role, is_guest=True)
