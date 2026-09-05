"""Minimal admin auth for the Owner Dashboard (V1-appropriate, not over-built).

POST /admin/login returns a fixed admin token. The require_admin dependency
checks the Authorization: Bearer header against that token. Credentials come
from the environment with sane defaults.
"""

import os

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from dotenv import load_dotenv

from . import errors

load_dotenv()

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "sofra-admin-token-2026")


def check_credentials(username: str, password: str) -> bool:
    return username == ADMIN_USERNAME and password == ADMIN_PASSWORD


def get_token() -> str:
    return ADMIN_TOKEN


_security = HTTPBearer(auto_error=False)


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_security),
) -> None:
    if credentials is None or credentials.credentials != ADMIN_TOKEN:
        raise errors.unauthorized()
