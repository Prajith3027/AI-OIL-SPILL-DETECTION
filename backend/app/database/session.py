"""
Database session factory.
SQLAlchemy engine and session are configured here.
No tables are created in Module 1 — only connection setup.
"""
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

def _build_engine():
    db_url = settings.database_url or "sqlite:///./oilspill.db"
    if "postgresql+psycopg://" in db_url:
        db_url = db_url.replace("postgresql+psycopg://", "postgresql+psycopg2://")

    if db_url.startswith("sqlite"):
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            echo=settings.debug,
        )

    try:
        eng = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            echo=settings.debug,
        )
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return eng
    except Exception as e:
        logger.warning("Could not connect to PostgreSQL (%s). Falling back to SQLite local database.", e)
        return create_engine(
            "sqlite:///./oilspill.db",
            connect_args={"check_same_thread": False},
            echo=settings.debug,
        )

engine = _build_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


def get_db():
    """
    FastAPI dependency that yields a database session.
    Automatically closes the session when the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """
    Test database connectivity.
    Returns True if connection succeeds, False otherwise.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
