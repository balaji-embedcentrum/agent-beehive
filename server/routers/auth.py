from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt as _bcrypt
from datetime import datetime, timedelta, timezone
from models.user import User, Token, TokenData
from db.database import get_pool
import os
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = os.getenv("JWT_SECRET", "changeme")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))


def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    pool = await get_pool()
    row = await pool.fetchrow("SELECT * FROM users WHERE username=$1", username)
    if row is None:
        raise credentials_exc
    return User(id=row["id"], username=row["username"], email=row["email"], is_admin=row["is_admin"])


@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    pool = await get_pool()
    row = await pool.fetchrow("SELECT * FROM users WHERE username=$1", form.username)
    if not row or not _bcrypt.checkpw(form.password.encode(), row["hashed_password"].encode()):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token = create_token({"sub": row["username"]})
    return Token(access_token=token)


@router.get("/me", response_model=User)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
