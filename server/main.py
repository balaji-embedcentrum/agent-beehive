"""BeehiveHQ Server — Universal AI Agent Group Chat Platform"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import os

from db.database import create_pool, close_pool
from services.registry import health_check_loop
from routers import auth, agents, chat, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    pool = await create_pool()
    await ensure_admin_user(pool)
    # Start background health checker
    task = asyncio.create_task(health_check_loop())
    yield
    # Shutdown
    task.cancel()
    await close_pool()


async def ensure_admin_user(pool):
    """Create admin user on first run if not exists."""
    import bcrypt as _bcrypt
    username = os.getenv("ADMIN_USERNAME", "admin")
    password = os.getenv("ADMIN_PASSWORD", "changeme")
    exists = await pool.fetchval("SELECT id FROM users WHERE username=$1", username)
    if not exists:
        hashed = _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()
        await pool.execute(
            """INSERT INTO users (username, hashed_password, is_admin)
               VALUES ($1, $2, TRUE) ON CONFLICT DO NOTHING""",
            username, hashed
        )
        print(f"[startup] Admin user '{username}' created")


app = FastAPI(
    title="BeehiveHQ",
    description="Universal AI Agent Group Chat Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(chat.router)
app.include_router(ws.router)


@app.get("/")
async def root():
    return {
        "name": "BeehiveHQ",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
