"""
Backend authorization dependencies (RBAC).

    authenticate_user  - any valid, active account (401 otherwise)
    require_citizen    - role == citizen            (403 otherwise)
    require_admin      - role == admin              (403 otherwise)
    require_citizen_or_admin - any authenticated role

Role is always re-read from the database, so deactivation / role changes
take effect immediately even for tokens that have not expired.
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import TokenError, decode_access_token
from app.database.session import get_db
from app.models.user import ROLE_ADMIN, ROLE_CITIZEN, User

_bearer = HTTPBearer(auto_error=False)

_UNAUTH = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


def authenticate_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None or creds.scheme.lower() != "bearer":
        raise _UNAUTH
    try:
        payload = decode_access_token(creds.credentials)
    except TokenError:
        raise _UNAUTH
    user = db.get(User, payload.get("sub"))
    if user is None:
        raise _UNAUTH
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
    return user


def require_citizen(user: User = Depends(authenticate_user)) -> User:
    if user.role != ROLE_CITIZEN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Citizen access required")
    return user


def require_admin(user: User = Depends(authenticate_user)) -> User:
    if user.role != ROLE_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required")
    return user


def require_citizen_or_admin(user: User = Depends(authenticate_user)) -> User:
    return user


def get_current_user_optional(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    """Returns authenticated User if valid token present, otherwise None without raising 401."""
    if creds is None or creds.scheme.lower() != "bearer":
        return None
    try:
        payload = decode_access_token(creds.credentials)
    except TokenError:
        return None
    user = db.get(User, payload.get("sub"))
    if user is None or not user.is_active:
        return None
    return user
