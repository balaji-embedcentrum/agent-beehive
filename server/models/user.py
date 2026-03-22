from pydantic import BaseModel
from typing import Optional
import uuid


class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None


class User(BaseModel):
    id: uuid.UUID
    username: str
    email: Optional[str]
    is_admin: bool = False

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
