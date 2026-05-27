from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "S.M.I.L.E Booking Orchestrator"
    app_port: int = 7777
    llm_base_url: str = "http://localhost:8000/v1"
    llm_api_key: str = "local-dev-key"
    llm_model: str = "smile-agent"
    llm_enabled: bool = False
    llm_temperature: float = 0.0
    llm_max_tokens: int = 256
    clinical_emr_base_url: str = "http://localhost:3004"
    clinical_emr_api_prefix: str = "/api/v1"
    clinical_emr_internal_token: str | None = None


def get_settings() -> Settings:
    return Settings()
