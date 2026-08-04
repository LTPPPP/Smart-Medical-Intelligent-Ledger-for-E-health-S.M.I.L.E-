"""Document ingestion pipeline."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from langchain_text_splitters import RecursiveCharacterTextSplitter

from ...shared.text_extract import extract_text
from ...shared.vectorstore import delete_document, ensure_collection, upsert_chunks
from .conflict_detector import check_conflicts
from .duplicate_detector import check_duplicate

_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120)


class DuplicateDocumentError(Exception):
    def __init__(self, duplicate_of_document_id: str):
        self.duplicate_of_document_id = duplicate_of_document_id
        super().__init__(f"Near-duplicate of document {duplicate_of_document_id}")


@dataclass(frozen=True)
class IngestResult:
    document_id: str
    filename: str
    chunk_count: int
    warnings: list[str]


async def ingest_document(*, filename: str, content: bytes, replace_document_id: str | None = None) -> IngestResult:
    ensure_collection()
    full_text = extract_text(filename, content)

    dup = check_duplicate(full_text)
    if dup.is_exact_duplicate or dup.is_near_duplicate:
        raise DuplicateDocumentError(dup.duplicate_of_document_id)

    if replace_document_id:
        delete_document(replace_document_id)

    document_id = replace_document_id or str(uuid.uuid4())
    chunks = _splitter.split_text(full_text)

    warnings: list[str] = []
    for chunk in chunks:
        findings = await check_conflicts(chunk, new_doc_id=document_id)
        for finding in findings:
            warnings.append(
                f"Có vẻ mâu thuẫn với tài liệu {finding.candidate_document_id}: "
                f"{finding.explanation}"
            )

    upsert_chunks(
        doc_id=document_id,
        filename=filename,
        chunks=chunks,
        sha256_hex=dup.sha256_hex,
        simhash=dup.simhash,
    )

    return IngestResult(
        document_id=document_id, filename=filename, chunk_count=len(chunks), warnings=warnings
    )
