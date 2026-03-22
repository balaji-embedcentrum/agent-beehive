from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid


class MessageCreate(BaseModel):
    content: str
    room_id: Optional[uuid.UUID] = None  # defaults to general room


class Message(BaseModel):
    id: uuid.UUID
    room_id: uuid.UUID
    content: str
    sender_type: str    # 'user' | 'agent'
    sender_name: str
    sender_id: Optional[str]
    mentions: List[str] = []
    is_broadcast: bool = False
    metadata: dict = {}
    created_at: datetime

    class Config:
        from_attributes = True


class Room(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    created_at: datetime
