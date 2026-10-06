"""
Auth endpoints — /api/auth
  POST /login            email + password + selected portal role
  POST /register         self-service CITIZEN registration (role is never client-controlled)
  GET  /me               current user
  POST /forgot-password  generic response (no account enumeration)
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import authenticate_user
from app.core.security import (
    DUMMY_HASH, clear_failures, create_access_token, hash_password,
    is_locked_out, record_failure, validate_password_strength, verify_password,
)
from app.database.session import get_db
from app.models.user import ROLE_CITIZEN, User

router = APIRouter(prefix="/auth", tags=["Authentication"])

_EMAIL_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$")


def _norm_email(v: str) -> str:
    v = v.strip().lower()
    if len(v) > 254 or not _EMAIL_RE.match(v):
        raise ValueError("Invalid email address")
    return v


class LoginRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=1, max_length=128)
    role: Literal["citizen", "admin"]

    @field_validator("email")
    @classmethod
    def _e(cls, v: str) -> str:
        return _norm_email(v)


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    email: str
    password: str = Field(..., max_length=128)

    @field_validator("email")
    @classmethod
    def _e(cls, v: str) -> str:
        return _norm_email(v)

    @field_validator("name")
    @classmethod
    def _n(cls, v: str) -> str:
        return v.strip()

    @field_validator("password")
    @classmethod
    def _p(cls, v: str) -> str:
        validate_password_strength(v)
        return v


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def _e(cls, v: str) -> str:
        return _norm_email(v)


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


@router.post("/login", response_model=TokenResponse, summary="Authenticate and receive a JWT")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    client = request.client.host if request.client else "unknown"
    key = f"{payload.email}|{client}"
    if is_locked_out(key):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts. Try again later.")

    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    # Always run a bcrypt verification so response timing does not reveal account existence.
    ok = verify_password(payload.password, user.password_hash if user else DUMMY_HASH)
    if user is None or not ok:
        record_failure(key)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    # Credentials are valid from here on.
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is inactive")
    if user.role != payload.role:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Unauthorized role. Please use the correct login option.",
        )

    clear_failures(key)
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    token, expires_in = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, expires_in=expires_in, user=UserOut.model_validate(user))


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED,
             summary="Register a citizen account")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    exists = db.execute(select(User.id).where(User.email == payload.email)).first()
    if exists:
        # Generic message; do not confirm which part failed beyond what registration needs.
        raise HTTPException(status.HTTP_409_CONFLICT, "Unable to register with these details")
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=ROLE_CITIZEN,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/me", response_model=UserOut, summary="Current authenticated user")
def me(user: User = Depends(authenticate_user)):
    return UserOut.model_validate(user)


@router.post("/forgot-password", summary="Request password reset (generic response)")
def forgot_password(payload: ForgotPasswordRequest):
    # No mail transport is configured; always respond identically to avoid account enumeration.
    return {"message": "If an account exists for this email, the administrator has been notified."}
