"""Shared HTTP error helpers producing the documented error shape:
    {"error": {"code": "...", "message": "..."}}

A dedicated APIError + handler is used (instead of HTTPException(detail=...))
so the envelope is returned at the top level and never nested under "detail".
"""

from fastapi import Request
from fastapi.responses import JSONResponse


class APIError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


async def api_error_handler(_: Request, exc: APIError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


def not_found(code: str, message: str) -> APIError:
    return APIError(404, code, message)


def bad_request(code: str, message: str) -> APIError:
    return APIError(400, code, message)


def conflict(code: str, message: str) -> APIError:
    return APIError(409, code, message)


def unauthorized(code: str = "unauthorized", message: str = "Unauthorized") -> APIError:
    return APIError(401, code, message)
