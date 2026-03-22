import asyncpg
import os
from typing import Optional

_pool: Optional[asyncpg.Pool] = None


async def create_pool():
    global _pool
    _pool = await asyncpg.create_pool(
        dsn=os.getenv("DATABASE_URL", "postgresql://agent-beehive:changeme@localhost:5432/agent-beehive"),
        min_size=2,
        max_size=20,
    )
    return _pool


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        await create_pool()
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
