import os

class Settings:
    PROJECT_NAME: str = "CampusPilot API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_hackathon_only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./local_data/campuspilot_v2.db")

settings = Settings()
