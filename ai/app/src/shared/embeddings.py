"""Dense and sparse embedding clients."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal, Protocol

from fastembed import SparseEmbedding, SparseTextEmbedding
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings
from langchain_openai import OpenAIEmbeddings

from ..config import get_settings

EmbeddingProvider = Literal["openai", "nvidia"]

# Dims per provider
DENSE_DIMS: dict[EmbeddingProvider, int] = {"openai": 1536, "nvidia": 4096}
SPARSE_VECTOR_NAME = "bm25"


class EmbeddingClient(Protocol):
    def embed_query(self, text: str) -> list[float]: ...
    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...


def active_provider() -> EmbeddingProvider:
    return "nvidia" if get_settings().embedding_provider == "nvidia" else "openai"


@lru_cache
def get_dense_embedding_client(provider: EmbeddingProvider | None = None) -> EmbeddingClient:
    settings = get_settings()
    provider = provider or active_provider()
    if provider == "nvidia":
        return NVIDIAEmbeddings(
            model=settings.embedding_model,
            api_key=settings.llm_api_key,
            base_url=settings.embedding_base_url,
        )
    return OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        api_key=settings.openai_api_key,
    )


@lru_cache
def _sparse_model() -> SparseTextEmbedding:
    return SparseTextEmbedding(model_name="Qdrant/bm25")


def embed_sparse_documents(texts: list[str]) -> list[SparseEmbedding]:
    return list(_sparse_model().embed(texts))


def embed_sparse_query(text: str) -> SparseEmbedding:
    return next(iter(_sparse_model().query_embed([text])))
