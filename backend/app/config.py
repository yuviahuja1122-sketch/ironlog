from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    GEMINI_FAST_MODEL: str = "gemini-3.8-flash"
    GEMINI_COACH_MODEL: str = "gemini-3.1-pro"
    SECRET_KEY: str = "ironlog-super-secret-key-change-in-production"
    DATABASE_URL: str = "sqlite+aiosqlite:///./ironlog.db"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
