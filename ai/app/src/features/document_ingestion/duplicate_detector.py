"""Exact and near-duplicate checks."""

from __future__ import annotations

from dataclasses import dataclass

from ...shared.hashing import hamming_distance, sha256_hex, simhash64
from ...shared.vectorstore import find_document_by_sha256, list_document_simhashes

_NEAR_DUPLICATE_MAX_HAMMING_DISTANCE = 3


@dataclass(frozen=True)
class DuplicateCheckResult:
    is_exact_duplicate: bool
    is_near_duplicate: bool
    duplicate_of_document_id: str | None
    sha256_hex: str
    simhash: int


def check_duplicate(full_text: str) -> DuplicateCheckResult:
    digest = sha256_hex(full_text)
    fingerprint = simhash64(full_text)

    exact_match = find_document_by_sha256(digest)
    if exact_match:
        return DuplicateCheckResult(
            is_exact_duplicate=True,
            is_near_duplicate=False,
            duplicate_of_document_id=exact_match["doc_id"],
            sha256_hex=digest,
            simhash=fingerprint,
        )

    for document_id, other_fingerprint in list_document_simhashes():
        if hamming_distance(fingerprint, other_fingerprint) <= _NEAR_DUPLICATE_MAX_HAMMING_DISTANCE:
            return DuplicateCheckResult(
                is_exact_duplicate=False,
                is_near_duplicate=True,
                duplicate_of_document_id=document_id,
                sha256_hex=digest,
                simhash=fingerprint,
            )

    return DuplicateCheckResult(
        is_exact_duplicate=False,
        is_near_duplicate=False,
        duplicate_of_document_id=None,
        sha256_hex=digest,
        simhash=fingerprint,
    )
