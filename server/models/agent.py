from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
import uuid


class AgentCreate(BaseModel):
    name: str                          # slug: minidobby
    display_name: str                  # Mini Dobby
    url: str                           # http://host:port
    adapter: str = "generic"           # hermes|ollama|openai|generic
    model: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    is_default: bool = False
    capabilities: List[str] = []


class Agent(AgentCreate):
    id: uuid.UUID
    is_online: bool = False
    last_seen: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AgentStatus(BaseModel):
    name: str
    is_online: bool
    last_seen: Optional[datetime]
    model: Optional[str]
