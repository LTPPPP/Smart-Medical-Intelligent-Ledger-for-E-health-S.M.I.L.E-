from __future__ import annotations

import re
import unicodedata


VIETNAMESE_LETTER_PATTERN = re.compile(r"[^\W\d_]", flags=re.UNICODE)


def normalize_for_match(text: str) -> str:
    mapped = text.replace("Đ", "D").replace("đ", "d")
    without_marks = "".join(
        char
        for char in unicodedata.normalize("NFD", mapped)
        if unicodedata.category(char) != "Mn"
    )
    return unicodedata.normalize("NFC", without_marks).upper()


def compact_for_match(text: str) -> str:
    return "".join(char for char in normalize_for_match(text) if char.isalnum())


def clean_human_text(text: str, *, allowed_punctuation: str = " ,./-'") -> str | None:
    text = unicodedata.normalize("NFC", text)
    allowed = set(allowed_punctuation)
    chars = []
    for char in text:
        category = unicodedata.category(char)
        if category.startswith("L") or category.startswith("M") or char.isdigit() or char in allowed:
            chars.append(char)
        else:
            chars.append(" ")
    cleaned = re.sub(r"\s+", " ", "".join(chars).upper()).strip(" ,./-'")
    return cleaned or None


def has_diacritics(text: str | None) -> bool:
    if not text:
        return False
    normalized = unicodedata.normalize("NFD", text)
    return any(unicodedata.category(char) == "Mn" for char in normalized) or any(
        char in text for char in "Đđ"
    )


def comparable_text(text: str | None) -> str:
    if not text:
        return ""
    return "".join(char for char in normalize_for_match(text) if char.isalnum())
