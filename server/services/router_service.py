"""Message routing — parse @mentions and dispatch to agents."""
import re
import httpx
import asyncio
from typing import List, Optional, Dict, Any
from db.database import get_pool
from services.bus import broadcast_to_ui


MENTION_RE = re.compile(r"@(\w+)", re.IGNORECASE)


def parse_mentions(content: str) -> List[str]:
    return [m.lower() for m in MENTION_RE.findall(content)]


async def get_online_agents(pool) -> List[Dict]:
    rows = await pool.fetch(
        "SELECT name, url, display_name, is_default FROM agents WHERE is_online = TRUE"
    )
    return [dict(r) for r in rows]


async def get_default_agent(pool) -> Optional[Dict]:
    row = await pool.fetchrow(
        "SELECT name, url, display_name FROM agents WHERE is_default = TRUE AND is_online = TRUE LIMIT 1"
    )
    return dict(row) if row else None


async def call_agent(agent_url: str, message: str, session_id: str, from_agent: str = "user") -> str:
    """Call an agent's /chat endpoint and return its response."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(f"{agent_url}/chat", json={
            "message": message,
            "session_id": session_id,
            "from_agent": from_agent,
        })
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", "")


async def route_message(
    pool,
    room_id: str,
    content: str,
    sender_name: str,
    session_id: str,
) -> List[Dict[str, Any]]:
    """
    Route a user message to the right agent(s) based on @mentions.
    Returns list of agent responses.
    """
    mentions = parse_mentions(content)
    is_broadcast = "all" in mentions

    responses = []

    if is_broadcast:
        # @all — send to every online agent
        agents = await get_online_agents(pool)
        tasks = [
            call_agent(a["url"], content, session_id, sender_name)
            for a in agents
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for agent, result in zip(agents, results):
            if isinstance(result, Exception):
                text = f"_(agent offline or error: {result})_"
            else:
                text = result
            responses.append({"agent": agent, "response": text})

    elif mentions:
        # @specific agents
        for mention in mentions:
            if mention == "all":
                continue
            row = await pool.fetchrow(
                "SELECT name, url, display_name FROM agents WHERE name = $1 AND is_online = TRUE",
                mention
            )
            if not row:
                responses.append({
                    "agent": {"name": mention, "display_name": mention},
                    "response": f"_(agent '{mention}' is not online)_"
                })
                continue
            agent = dict(row)
            try:
                response = await call_agent(agent["url"], content, session_id, sender_name)
            except Exception as e:
                response = f"_(error reaching {mention}: {e})_"
            responses.append({"agent": agent, "response": response})

    else:
        # No mention — route to default agent
        agent = await get_default_agent(pool)
        if agent:
            try:
                response = await call_agent(agent["url"], content, session_id, sender_name)
            except Exception as e:
                response = f"_(error reaching default agent: {e})_"
            responses.append({"agent": agent, "response": response})
        else:
            responses.append({
                "agent": {"name": "system", "display_name": "System"},
                "response": "No agents are online. Please add and start an agent first."
            })

    return responses
