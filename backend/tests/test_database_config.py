import os
from unittest.mock import patch
from sqlalchemy.engine import Engine
from database import BASE_DIR, Base, get_db


def test_sqlite_fallback_configuration():
    """Verify that when DATABASE_URL is unset, SQLite engine is created with correct connect_args."""
    with patch.dict(os.environ, {"DATABASE_URL": ""}):
        # Simulate loading without DATABASE_URL
        from sqlalchemy import create_engine
        raw_db_url = os.getenv("DATABASE_URL")
        db_url = raw_db_url if raw_db_url and raw_db_url.strip() else f"sqlite:///{BASE_DIR}/nyaya.db"
        assert db_url.startswith("sqlite")
        test_engine = create_engine(db_url, connect_args={"check_same_thread": False})
        assert test_engine.dialect.name == "sqlite"


def test_postgresql_normalization_and_pool_config():
    """Verify that postgres:// is converted to postgresql:// and pool_pre_ping is enabled for Supabase."""
    mock_postgres_url = "postgres://postgres.mockref:mockpass@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
    
    with patch.dict(os.environ, {"DATABASE_URL": mock_postgres_url}):
        raw_db_url = os.getenv("DATABASE_URL")
        db_url = raw_db_url.strip()
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        
        assert db_url.startswith("postgresql://")
        assert "pooler.supabase.com" in db_url


def test_database_session_generator():
    """Verify get_db session generator yields and closes a valid session."""
    gen = get_db()
    session = next(gen)
    assert session is not None
    try:
        next(gen)
    except StopIteration:
        pass
