"""SHA256 and SimHash dedup."""

from __future__ import annotations

import hashlib
import re

_SHINGLE_SIZE = 3
_FINGERPRINT_BITS = 64
_TOKEN_RE = re.compile(r"\w+", re.UNICODE)


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def _shingles(tokens: list[str], size: int = _SHINGLE_SIZE) -> list[str]:
    if len(tokens) < size:
        return [" ".join(tokens)] if tokens else []
    return [" ".join(tokens[i : i + size]) for i in range(len(tokens) - size + 1)]


def _hash_shingle(shingle: str) -> int:
    digest = hashlib.md5(shingle.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], byteorder="big", signed=False)


def simhash64(text: str) -> int:
    """Compute 64-bit SimHash."""
    shingles = _shingles(_tokenize(text))
    if not shingles:
        return 0

    weights = [0] * _FINGERPRINT_BITS
    for shingle in shingles:
        h = _hash_shingle(shingle)
        for bit in range(_FINGERPRINT_BITS):
            weights[bit] += 1 if (h >> bit) & 1 else -1

    fingerprint = 0
    for bit in range(_FINGERPRINT_BITS):
        if weights[bit] > 0:
            fingerprint |= 1 << bit
    return fingerprint


def hamming_distance(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


def is_near_duplicate(
    fingerprint: int, existing_fingerprints: list[int], max_distance: int = 3
) -> tuple[bool, int | None]:
    """Check near-duplicate match."""
    for idx, other in enumerate(existing_fingerprints):
        if hamming_distance(fingerprint, other) <= max_distance:
            return True, idx
    return False, None
