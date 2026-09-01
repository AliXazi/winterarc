import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from pathlib import Path

# Render/Railway/Fly provide DATABASE_URL (postgres://...). Fallback to sqlite for local.
_raw = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./winterarc.db")
# Render gives postgres:// but sqlalchemy needs postgresql://
if _raw.startswith("postgres://"):
    _raw = _raw.replace("postgres://", "postgresql+asyncpg://", 1)
elif _raw.startswith("postgresql://") and "+asyncpg" not in _raw:
    _raw = _raw.replace("postgresql://", "postgresql+asyncpg://", 1)
# sqlite keep as is
DATABASE_URL = _raw

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_session():
    async with async_session() as session:
        yield session

async def init_db():
    from app import models  # noqa
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # lightweight migrations
        try:
            from sqlalchemy import text
            if DATABASE_URL.startswith("sqlite"):
                try: await conn.execute(text("ALTER TABLE winterarc_states ADD COLUMN arc_start_date VARCHAR(20)"))
                except: pass
                try: await conn.execute(text("ALTER TABLE winterarc_states ADD COLUMN arc_days INTEGER DEFAULT 90"))
                except: pass
            else:
                await conn.execute(text("ALTER TABLE winterarc_states ADD COLUMN IF NOT EXISTS arc_start_date VARCHAR(20)"))
                await conn.execute(text("ALTER TABLE winterarc_states ADD COLUMN IF NOT EXISTS arc_days INTEGER DEFAULT 90"))
        except Exception:
            pass
