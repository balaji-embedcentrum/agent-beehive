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
import json as _json

router = APIRouter(prefix="/chat", tags=["chat"])


def serialize(obj):
    """JSON serializer for objects not serializable by default json code."""
    if isinstance(obj, (uuid.UUID,)):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def row_to_dict(row):
    d = dict(row)
    d["id"] = str(d["id"])
    d["room_id"] = str(d["room_id"])
    if d.get("created_at"):
        d["created_at"] = d["created_at"].isoformat()
    if isinstance(d.get("metadata"), str):
        try:
            d["metadata"] = _json.loads(d["metadata"])
        except Exception:
            d["metadata"] = {}
    return d


async def save_message(pool, room_id, content, sender_type, sender_name, sender_id,
                       mentions=None, is_broadcast=False, metadata=None):
    row = await pool.fetchrow(
        """INSERT INTO messages (room_id, content, sender_type, sender_name, sender_id,
           mentions, is_broadcast, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *""",
        room_id, content, sender_type, sender_name, str(sender_id),
        mentions or [], is_broadcast, _json.dumps(metadata or {})
    )
    return row_to_dict(row)


@router.post("/send")
async def send_message(msg: MessageCreate, current_user: User = Depends(get_current_user)):
    pool = await get_pool()

    if msg.room_id is None:
        row = await pool.fetchrow("SELECT id FROM rooms WHERE name='general' LIMIT 1")
        room_id = row["id"]
    else:
        room_id = msg.room_id

    mentions = parse_mentions(msg.content)
    is_broadcast = "all" in mentions

    user_msg = await save_message(
        pool, room_id, msg.content, "user", current_user.username,
        current_user.id, mentions, is_broadcast
    )

    await broadcast_to_ui(str(room_id), {"type": "message", "message": user_msg})

    responses = await route_message(
        pool, str(room_id), msg.content,
        current_user.username, str(current_user.id)
    )

    for r in responses:
        agent = r["agent"]
        agent_msg = await save_message(
            pool, room_id, r["response"], "agent",
            agent.get("display_name", agent["name"]),
            agent["name"], [], False,
            {"agent_name": agent["name"]}
        )
        await broadcast_to_ui(str(room_id), {"type": "message", "message": agent_msg})

    return {"ok": True, "responses": len(responses)}


@router.get("/history/{room_id}")
async def get_history(room_id: uuid.UUID, limit: int = 100, current_user: User = Depends(get_current_user)):
    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT * FROM messages WHERE room_id=$1 ORDER BY created_at DESC LIMIT $2""",
        room_id, limit
    )
    return list(reversed([row_to_dict(r) for r in rows]))


@router.get("/rooms")
async def list_rooms(current_user: User = Depends(get_current_user)):
    pool = await get_pool()
    rows = await pool.fetch("SELECT * FROM rooms ORDER BY created_at")
    result = []
    for r in rows:
        d = dict(r)
        d["id"] = str(d["id"])
        d["created_at"] = d["created_at"].isoformat()
        if d.get("created_by"):
            d["created_by"] = str(d["created_by"])
        result.append(d)
    return result
