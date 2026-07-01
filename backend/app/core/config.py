import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Frigorífico J&E ERP"
    API_V1_STR: str = "/api"

    # Security — SECRET_KEY must be set via environment variable; no insecure default
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # DB & Services — must be provided via environment; defaults only for local dev
    DATABASE_URL: str = "postgresql://postgres:postgres_password@db:5432/frigodb"
    REDIS_URL: str = "redis://redis:6379/0"

    # CORS — explicit list required; "*" is only allowed when deliberately set
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost,http://localhost:5173"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            if v == "*":
                return ["*"]
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Enterprise details — override via .env for each deployment
    EMPRESA_NOMBRE: str = "FRIGORIFICO DE CERDO J&E"
    EMPRESA_CUIT: str = "30-71543210-9"
    EMPRESA_DIRECCION: str = "Av. Circunvalación N° 4500, Córdoba, Argentina"
    EMPRESA_TELEFONO: str = "+5493512345678"
    EMPRESA_EMAIL: str = "contacto@frigorificoje.com.ar"

    # PDF Upload directory
    UPLOAD_DIR: str = "/app/uploads"

    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Ensure Upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
