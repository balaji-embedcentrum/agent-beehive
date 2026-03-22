"""Redis pub/sub bus for agent-to-agent messaging."""
import redis.asyncio as redis
import os
import json
from typing import Callable, Awaitable

_client: redis.Redis = None


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(
            os.getenv("REDIS_URL", "redis://localhost:6379"),
            decode_responses=True
        )
    return _client


async def publish(channel: str, message: dict):
    """Publish a message to a Redis channel."""
    r = get_redis()
    await r.publish(channel, json.dumps(message))


async def subscribe_agent(agent_name: str, callback: Callable[[dict], Awaitable[None]]):
    """Subscribe to an agent's inbox channel."""
    r = get_redis()
    channel = f"agent:{agent_name}:inbox"
    pubsub = r.pubsub()
    await pubsub.subscribe(channel)
    async for raw in pubsub.listen():
        if raw["type"] == "message":
            try:
                data = json.loads(raw["data"])
                await callback(data)
            except Exception as e:
                print(f"[bus] Error processing message for {agent_name}: {e}")


async def broadcast_to_ui(room_id: str, message: dict):
    """Broadcast a message to all UI WebSocket subscribers for a room."""
    r = get_redis()
    channel = f"room:{room_id}:broadcast"
    await r.publish(channel, json.dumps(message))
