from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # LLM
    provider: str = "openai"
    openai_api_key: str
    openai_chat_model: str = "gpt-4o-mini"
    llm_api_key: str
    llm_model: str = "openai/gpt-oss-120b"
    llm_base_url: str = "https://integrate.api.nvidia.com/v1"

    # Embedding
    embedding_provider: str = "openai"
    openai_embedding_model: str = "text-embedding-3-small"
    embedding_model: str = "nvidia/nv-embed-v1"
    embedding_base_url: str = "https://integrate.api.nvidia.com/v1"

    # Qdrant
    qdrant_url: str
    qdrant_api_key: str
    qdrant_collection: str = "smile_kb"

    # NestJS Backend
    clinical_emr_service_url: str = "http://localhost:8082"
    iam_service_url: str = "http://localhost:8081"
    auth_jwt_secret: str = "smile-dev-jwt-secret-change-in-production"

    # Bot Service Account
    bot_account_email: str
    bot_account_password: str

    # Type 2 Escalation Contact
    guest_escalation_phone: str = "09XXXXX"
    guest_escalation_email: str = "recep.levan@smile.com"

    cors_origins: str = "*"


@lru_cache
def get_settings() -> Settings:
    return Settings()
