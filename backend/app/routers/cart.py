from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import errors, schemas
from ..database import get_db
from ..services import cart_service

router = APIRouter()


@router.get("/cart")
def get_cart(conversation_id: str, db: Session = Depends(get_db)):
    return {
        "lines": cart_service.get_cart(db, conversation_id),
        "total": cart_service.calculate_total(db, conversation_id),
    }


@router.post("/cart")
def add_to_cart(
    conversation_id: str,
    customer_id: str,
    data: schemas.CartAddRequestBody,
    db: Session = Depends(get_db),
):
    try:
        lines = cart_service.add_line(db, conversation_id, customer_id, data)
    except ValueError as e:
        raise errors.bad_request("invalid_cart", str(e))
    return {
        "lines": lines,
        "total": cart_service.calculate_total(db, conversation_id),
    }


@router.patch("/cart/{key_id}")
def update_cart_quantity(
    key_id: int,
    conversation_id: str,
    data: schemas.CartQuantityUpdate,
    db: Session = Depends(get_db),
):
    try:
        lines = cart_service.update_quantity(db, conversation_id, key_id, data.quantity)
    except ValueError as e:
        raise errors.bad_request("invalid_quantity", str(e))
    return {
        "lines": lines,
        "total": cart_service.calculate_total(db, conversation_id),
    }


@router.delete("/cart/{key_id}")
def remove_from_cart(key_id: int, conversation_id: str, db: Session = Depends(get_db)):
    lines = cart_service.remove_line(db, conversation_id, key_id)
    return {
        "lines": lines,
        "total": cart_service.calculate_total(db, conversation_id),
    }
