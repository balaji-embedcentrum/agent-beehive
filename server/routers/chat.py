from fastapi import APIRouter, Depends, HTTPException
from models.message import Message, MessageCreate
from models.user import User
from routers.auth import get_current_user
from db.database import get_pool
from services.router_service import route_message, parse_mentions
from services.bus import broadcast_to_ui
from typing import List
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/chat", tags=["chat"])


async def save_message(pool, room_id, content, sender_type, sender_name, sender_id,
                       mentions=None, is_broadcast=False, metadata=None):
    row = await pool.fetchrow(
        """INSERT INTO messages (room_id, content, sender_type, sender_name, sender_id,
           mentions, is_broadcast, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *""",
        room_id, content, sender_type, sender_name, str(sender_id),
        mentions or [], is_broadcast, metadata or {}
    )
    return dict(row)


@router.post("/send")
async def send_message(msg: MessageCreate, current_user: User = Depends(get_current_user)):
    pool = await get_pool()

    # Get default room if not specified
    if msg.room_id is None:
        row = await pool.fetchrow("SELECT id FROM rooms WHERE name='general' LIMIT 1")
        room_id = row["id"]
    else:
        room_id = msg.room_id

    mentions = parse_mentions(msg.content)
    is_broadcast = "all" in mentions

    # Save user message
    user_msg = await save_message(
        pool, room_id, msg.content, "user", current_user.username,
        current_user.id, mentions, is_broadcast
    )

    # Broadcast user message to UI
    await broadcast_to_ui(str(room_id), {
        "type": "message",
        "message": {**user_msg, "room_id": str(room_id), "created_at": user_msg["created_at"].isoformat()}
    })

    # Route to agents
    responses = await route_message(
        pool, str(room_id), msg.content,
        current_user.username, str(current_user.id)
    )

    # Save and broadcast each agent response
    agent_messages = []
    for r in responses:
        agent = r["agent"]
        agent_msg = await save_message(
            pool, room_id, r["response"], "agent",
            agent.get("display_name", agent["name"]),
            agent["name"], [], False,
            {"agent_name": agent["name"]}
        )
        await broadcast_to_ui(str(room_id), {
            "type": "message",
            "message": {**agent_msg, "room_id": str(room_id), "created_at": agent_msg["created_at"].isoformat()}
        })
        agent_messages.append(agent_msg)

    return {"ok": True, "responses": len(responses)}


@router.get("/history/{room_id}", response_model=List[dict])
async def get_history(room_id: uuid.UUID, limit: int = 100, current_user: User = Depends(get_current_user)):
    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT * FROM messages WHERE room_id=$1 ORDER BY created_at DESC LIMIT $2""",
        room_id, limit
    )
    result = []
    for r in rows:
        d = dict(r)
        d["id"] = str(d["id"])
        d["room_id"] = str(d["room_id"])
        d["created_at"] = d["created_at"].isoformat()
        result.append(d)
    return list(reversed(result))


@router.get("/rooms")
async def list_rooms(current_user: User = Depends(get_current_user)):
    pool = await get_pool()
    rows = await pool.fetch("SELECT * FROM rooms ORDER BY created_at")
    result = []
    for r in rows:
        d = dict(r)
        d["id"] = str(d["id"])
        d["created_at"] = d["created_at"].isoformat()
        result.append(d)
    return result
