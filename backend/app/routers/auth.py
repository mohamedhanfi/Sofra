from fastapi import APIRouter

from .. import schemas
from ..deps import check_credentials, get_token

router = APIRouter()


@router.post("/admin/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest):
    if not check_credentials(payload.username, payload.password):
        from fastapi import HTTPException

        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "invalid_credentials", "message": "Invalid username or password."}},
        )
    return {"token": get_token(), "username": payload.username}
