"""Qdrant vector store wrapper."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

from qdrant_client import QdrantClient, models

from ..config import get_settings
from .embeddings import (
    DENSE_DIMS,
    SPARSE_VECTOR_NAME,
    EmbeddingProvider,
    active_provider,
    embed_sparse_documents,
    embed_sparse_query,
    get_dense_embedding_client,
)


@lru_cache
def get_qdrant_client() -> QdrantClient:
    settings = get_settings()
    return QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)


def collection_name(provider: EmbeddingProvider | None = None) -> str:
    return f"{get_settings().qdrant_collection}__{provider or active_provider()}"


def ensure_collection(provider: EmbeddingProvider | None = None) -> None:
    provider = provider or active_provider()
    client = get_qdrant_client()
    name = collection_name(provider)
    is_new = not client.collection_exists(name)
    if is_new:
        client.create_collection(
            collection_name=name,
            vectors_config=models.VectorParams(
                size=DENSE_DIMS[provider], distance=models.Distance.COSINE
            ),
            sparse_vectors_config={SPARSE_VECTOR_NAME: models.SparseVectorParams()},
        )

    # Ensure payload index
    existing_indexes = client.get_collection(name).payload_schema
    for field in ("doc_id", "sha256"):
        if field not in existing_indexes:
            client.create_payload_index(
                collection_name=name,
                field_name=field,
                field_schema=models.PayloadSchemaType.KEYWORD,
            )


def find_document_by_sha256(
    sha256_hex: str, provider: EmbeddingProvider | None = None
) -> dict[str, Any] | None:
    client = get_qdrant_client()
    hits, _ = client.scroll(
        collection_name=collection_name(provider),
        scroll_filter=models.Filter(
            must=[models.FieldCondition(key="sha256", match=models.MatchValue(value=sha256_hex))]
        ),
        limit=1,
    )
    return hits[0].payload if hits else None


def list_document_simhashes(provider: EmbeddingProvider | None = None) -> list[tuple[str, int]]:
    """List document simhashes."""
    client = get_qdrant_client()
    by_doc: dict[str, int] = {}
    offset = None
    while True:
        hits, offset = client.scroll(
            collection_name=collection_name(provider),
            with_payload=["doc_id", "simhash"],
            limit=256,
            offset=offset,
        )
        for h in hits:
            by_doc[h.payload["doc_id"]] = h.payload["simhash"]
        if offset is None:
            break
    return list(by_doc.items())


def list_documents(provider: EmbeddingProvider | None = None) -> list[dict[str, Any]]:
    client = get_qdrant_client()
    by_doc: dict[str, dict[str, Any]] = {}
    offset = None
    while True:
        hits, offset = client.scroll(
            collection_name=collection_name(provider),
            with_payload=["doc_id", "filename", "uploaded_at"],
            limit=256,
            offset=offset,
        )
        for h in hits:
            doc_id = h.payload["doc_id"]
            entry = by_doc.setdefault(
                doc_id,
                {"doc_id": doc_id, "filename": h.payload.get("filename"), "chunk_count": 0, "uploaded_at": h.payload.get("uploaded_at")},
            )
            entry["chunk_count"] += 1
        if offset is None:
            break
    return list(by_doc.values())


def delete_document(doc_id: str, provider: EmbeddingProvider | None = None) -> None:
    client = get_qdrant_client()
    client.delete(
        collection_name=collection_name(provider),
        points_selector=models.Filter(
            must=[models.FieldCondition(key="doc_id", match=models.MatchValue(value=doc_id))]
        ),
    )


def upsert_chunks(
    *,
    doc_id: str,
    filename: str,
    chunks: list[str],
    sha256_hex: str,
    simhash: int,
    provider: EmbeddingProvider | None = None,
) -> None:
    provider = provider or active_provider()
    client = get_qdrant_client()
    dense_vectors = get_dense_embedding_client(provider).embed_documents(chunks)
    sparse_vectors = embed_sparse_documents(chunks)
    uploaded_at = datetime.now(timezone.utc).isoformat()

    points = [
        models.PointStruct(
            id=str(uuid.uuid4()),
            vector={
                "": dense_vec,
                SPARSE_VECTOR_NAME: models.SparseVector(
                    indices=sparse_vec.indices.tolist(), values=sparse_vec.values.tolist()
                ),
            },
            payload={
                "doc_id": doc_id,
                "filename": filename,
                "chunk_index": idx,
                "content": chunk,
                "uploaded_at": uploaded_at,
                "sha256": sha256_hex,
                "simhash": simhash,
            },
        )
        for idx, (chunk, dense_vec, sparse_vec) in enumerate(zip(chunks, dense_vectors, sparse_vectors))
    ]
    client.upsert(collection_name=collection_name(provider), points=points)


def find_conflict_candidates(
    chunk_text: str,
    *,
    exclude_doc_id: str,
    low: float = 0.75,
    high: float = 0.92,
    limit: int = 5,
    provider: EmbeddingProvider | None = None,
) -> list[dict[str, Any]]:
    """Find conflict candidates."""
    client = get_qdrant_client()
    query_vector = get_dense_embedding_client(provider).embed_query(chunk_text)
    hits = client.query_points(
        collection_name=collection_name(provider),
        query=query_vector,
        using=None,
        limit=limit,
        query_filter=models.Filter(
            must_not=[
                models.FieldCondition(key="doc_id", match=models.MatchValue(value=exclude_doc_id))
            ]
        ),
    ).points
    return [{"score": h.score, **h.payload} for h in hits if low <= h.score < high]


def search_similar_chunks(
    query_text: str,
    *,
    limit: int = 5,
    exclude_doc_id: str | None = None,
    provider: EmbeddingProvider | None = None,
) -> list[dict[str, Any]]:
    """Hybrid dense + sparse search."""
    client = get_qdrant_client()
    dense_vector = get_dense_embedding_client(provider).embed_query(query_text)
    sparse_vector = embed_sparse_query(query_text)

    query_filter = None
    if exclude_doc_id:
        query_filter = models.Filter(
            must_not=[
                models.FieldCondition(key="doc_id", match=models.MatchValue(value=exclude_doc_id))
            ]
        )

    result = client.query_points(
        collection_name=collection_name(provider),
        prefetch=[
            models.Prefetch(query=dense_vector, using=None, limit=10, filter=query_filter),
            models.Prefetch(
                query=models.SparseVector(
                    indices=sparse_vector.indices.tolist(), values=sparse_vector.values.tolist()
                ),
                using=SPARSE_VECTOR_NAME,
                limit=10,
                filter=query_filter,
            ),
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        limit=limit,
    )
    return [{"score": h.score, **h.payload} for h in result.points]
