from __future__ import annotations

import re


EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
PHONE_RE = re.compile(r"(?<!\d)(?:\+?84|0)(?:\d[\s.-]?){8,10}\d(?!\d)")


def redact_text(text: str) -> str:
    redacted = EMAIL_RE.sub("[email]", text)
    redacted = PHONE_RE.sub("[phone]", redacted)
    return redacted
