"""Shared HTTP error helpers producing the documented error shape:
    {"error": {"code": "...", "message": "..."}}
"""

from fastapi import HTTPException


def not_found(code: str, message: str) -> HTTPException:
    return HTTPException(status_code=404, detail={"error": {"code": code, "message": message}})


def bad_request(code: str, message: str) -> HTTPException:
    return HTTPException(status_code=400, detail={"error": {"code": code, "message": message}})


def conflict(code: str, message: str) -> HTTPException:
    return HTTPException(status_code=409, detail={"error": {"code": code, "message": message}})
