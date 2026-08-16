import os
import warnings
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv()

# ── Security: JWT_SECRET / SECRET_KEY must be explicitly set ─────────────────────────────
_APP_ENV = os.getenv("APP_ENV", "development").lower()
_JWT_SECRET_RAW = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET")

_DEV_FALLBACK = "dev_jwt_secret_nyaya_drishti_sih_2024_prototype_key_32bytes"

if not _JWT_SECRET_RAW:
    if _APP_ENV == "development":
        warnings.warn(
            "JWT_SECRET not set in environment. Using insecure development fallback. "
            "Set JWT_SECRET in backend/.env before any demo or deployment.",
            stacklevel=1,
        )
        _JWT_SECRET_RAW = _DEV_FALLBACK
    else:
        # Covers APP_ENV=demo and APP_ENV=production.
        # Setting APP_ENV=demo on demo day guarantees a missing secret fails loudly
        # rather than silently using a known-weak key.
        raise RuntimeError(
            f"FATAL: JWT_SECRET environment variable is required when APP_ENV={_APP_ENV!r}. "
            "Add JWT_SECRET to backend/.env and restart."
        )

JWT_SECRET: str = _JWT_SECRET_RAW

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours for prototype session

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
