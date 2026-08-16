import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
# Explicitly load .env from backend directory first, then fallback to environment
load_dotenv(BASE_DIR / ".env", override=True)
load_dotenv(override=True)

raw_db_url = os.getenv("DATABASE_URL")

if raw_db_url and raw_db_url.strip():
    DATABASE_URL = raw_db_url.strip()
    # Normalize postgres:// to postgresql:// for SQLAlchemy 2.0+ compatibility
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    # Clean fallback to local SQLite database when DATABASE_URL is not set
    DATABASE_URL = f"sqlite:///{BASE_DIR}/nyaya.db"

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    # PostgreSQL configuration optimized for Supabase Session Pooler
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

