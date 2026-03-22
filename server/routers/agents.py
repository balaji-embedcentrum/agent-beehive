from fastapi import APIRouter, Depends, HTTPException
from models.agent import Agent, AgentCreate, AgentStatus
from models.user import User
from routers.auth import get_current_user
from db.database import get_pool
from typing import List
import uuid

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("", response_model=List[Agent])
async def list_agents(current_user: User = Depends(get_current_user)):
    pool = await get_pool()
    rows = await pool.fetch("SELECT * FROM agents ORDER BY created_at")
    return [Agent(**dict(r)) for r in rows]


@router.post("", response_model=Agent)
async def register_agent(agent: AgentCreate, current_user: User = Depends(get_current_user)):
    pool = await get_pool()
    # If this is the first agent, make it default
    count = await pool.fetchval("SELECT COUNT(*) FROM agents")
    is_default = agent.is_default or (count == 0)
    row = await pool.fetchrow(
        """INSERT INTO agents (name, display_name, url, adapter, model, description,
        avatar_url, is_default, capabilities, owner_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *""",
        agent.name, agent.display_name, agent.url, agent.adapter,
        agent.model, agent.description, agent.avatar_url, is_default,
        agent.capabilities, current_user.id
    )
    return Agent(**dict(row))


@router.delete("/{agent_name}")
async def remove_agent(agent_name: str, current_user: User = Depends(get_current_user)):
    pool = await get_pool()
    result = await pool.execute("DELETE FROM agents WHERE name=$1", agent_name)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"ok": True}


@router.get("/status", response_model=List[AgentStatus])
async def agent_statuses(current_user: User = Depends(get_current_user)):
    pool = await get_pool()
    rows = await pool.fetch("SELECT name, is_online, last_seen, model FROM agents ORDER BY name")
    return [AgentStatus(**dict(r)) for r in rows]


@router.post("/{agent_name}/set-default")
async def set_default_agent(agent_name: str, current_user: User = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute("UPDATE agents SET is_default=FALSE")
            result = await conn.execute("UPDATE agents SET is_default=TRUE WHERE name=$1", agent_name)
    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"ok": True}
