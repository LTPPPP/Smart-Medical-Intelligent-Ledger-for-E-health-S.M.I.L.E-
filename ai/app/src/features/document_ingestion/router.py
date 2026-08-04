"""Admin document endpoints."""

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from ...shared.text_extract import UnsupportedDocumentType
from ...shared.vectorstore import delete_document, list_documents
from .pipeline import DuplicateDocumentError, IngestResult, ingest_document

router = APIRouter(prefix="/documents", tags=["documents"])


def _to_response(result: IngestResult) -> dict:
    return {
        "doc_id": result.document_id,
        "filename": result.filename,
        "chunk_count": result.chunk_count,
        "warnings": result.warnings,
    }


@router.get("")
async def list_documents_endpoint() -> dict:
    return {
        "documents": [
            {
                "doc_id": doc["doc_id"],
                "filename": doc["filename"],
                "chunk_count": doc["chunk_count"],
            }
            for doc in list_documents()
        ]
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)) -> dict:
    content = await file.read()
    try:
        result = await ingest_document(filename=file.filename, content=content)
    except DuplicateDocumentError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tài liệu trùng hoặc gần trùng với tài liệu đã có (document_id={exc.duplicate_of_document_id}).",
        ) from exc
    except UnsupportedDocumentType as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    return _to_response(result)


@router.put("/{doc_id}")
async def update_document(doc_id: str, file: UploadFile = File(...)) -> dict:
    content = await file.read()
    try:
        result = await ingest_document(
            filename=file.filename, content=content, replace_document_id=doc_id
        )
    except DuplicateDocumentError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tài liệu trùng hoặc gần trùng với tài liệu đã có (document_id={exc.duplicate_of_document_id}).",
        ) from exc
    except UnsupportedDocumentType as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    return _to_response(result)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_document_endpoint(doc_id: str) -> None:
    delete_document(doc_id)
