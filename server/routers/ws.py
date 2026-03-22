"""WebSocket endpoint for real-time chat."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis.asyncio as aioredis
import os
import json
import asyncio

router = APIRouter(tags=["websocket"])

# Track active WebSocket connections per room
_connections: dict[str, list[WebSocket]] = {}


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, token: str = None):
    await websocket.accept()

    # Add to room connections
    if room_id not in _connections:
        _connections[room_id] = []
    _connections[room_id].append(websocket)

    # Subscribe to Redis room broadcast channel
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    r = aioredis.from_url(redis_url, decode_responses=True)
    pubsub = r.pubsub()
    channel = f"room:{room_id}:broadcast"
    await pubsub.subscribe(channel)

    async def redis_listener():
        async for raw in pubsub.listen():
            if raw["type"] == "message":
                try:
                    data = json.loads(raw["data"])
                    await websocket.send_json(data)
                except Exception:
                    pass

    listener_task = asyncio.create_task(redis_listener())

    try:
        while True:
            # Keep connection alive, handle client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        listener_task.cancel()
        await pubsub.unsubscribe(channel)
        await r.aclose()
        if room_id in _connections:
            _connections[room_id].remove(websocket)
