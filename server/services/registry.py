"""Background health checker — pings all agents every 30s."""
import asyncio
import httpx
from datetime import datetime, timezone
from db.database import get_pool


async def health_check_loop():
    """Continuously health-check all registered agents."""
    while True:
        try:
            pool = await get_pool()
            agents = await pool.fetch("SELECT id, name, url FROM agents")
            for agent in agents:
                is_online = await check_agent(agent["url"])
                await pool.execute(
                    """UPDATE agents SET is_online=$1, last_seen=$2 WHERE id=$3""",
                    is_online,
                    datetime.now(timezone.utc) if is_online else None,
                    agent["id"]
                )
        except Exception as e:
            print(f"[registry] Health check error: {e}")
        await asyncio.sleep(30)


async def check_agent(url: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{url}/health")
            return resp.status_code == 200
    except Exception:
        return False
