from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import errors, schemas
from ..database import get_db
from ..deps import require_admin
from ..services import order_service

router = APIRouter()


def _serialize_orders(db: Session, orders: list) -> list[dict]:
    order_service.attach_orders_rating(db, orders)
    return [order_service.serialize(o) for o in orders]


def _serialize_order(db: Session, order) -> dict:
    order_service.attach_order_rating(db, order)
    return order_service.serialize(order)


# ---- Public: place an order ----
@router.post("/orders", status_code=201)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        order = order_service.create_order(db, payload)
    except ValueError as e:
        raise errors.bad_request("order_error", str(e))
    return _serialize_order(db, order)


# ---- Public: customer order status by conversation ----
@router.get("/orders/status/{conversation_id}")
def order_status(conversation_id: str, db: Session = Depends(get_db)):
    order = order_service.get_order_by_conversation(db, conversation_id)
    if not order:
        raise errors.not_found("order_not_found", "No order found for this conversation.")
    return _serialize_order(db, order)


# ---- Public: customer ratings ----
@router.post("/orders/{order_id}/rating", status_code=201)
def rate_order(order_id: int, payload: schemas.RatingCreate, db: Session = Depends(get_db)):
    try:
        order_service.add_rating(db, order_id, payload.stars, payload.comment)
    except ValueError as e:
        raise errors.bad_request("rating_error", str(e))
    return {"ok": True}


# ---- Admin: order management ----
@router.get("/admin/orders", dependencies=[Depends(require_admin)])
def admin_list_orders(
    order_type: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    orders = order_service.list_orders(db, order_type=order_type, status=status)
    return _serialize_orders(db, orders)


@router.get("/admin/orders/{order_id}", dependencies=[Depends(require_admin)])
def admin_get_order(order_id: int, db: Session = Depends(get_db)):
    order = order_service.get_order(db, order_id)
    if not order:
        raise errors.not_found("order_not_found", "Order not found.")
    return _serialize_order(db, order)


@router.patch("/admin/orders/{order_id}/status", dependencies=[Depends(require_admin)])
def admin_update_status(order_id: int, payload: schemas.StatusUpdate, db: Session = Depends(get_db)):
    try:
        order = order_service.update_status(db, order_id, payload.status)
    except ValueError as e:
        raise errors.bad_request("status_error", str(e))
    order_service.attach_order_rating(db, order)
    return order_service.serialize(order)


@router.post("/admin/orders/{order_id}/cancel", dependencies=[Depends(require_admin)])
def admin_cancel_order(order_id: int, payload: schemas.CancelRequest, db: Session = Depends(get_db)):
    try:
        order = order_service.cancel_order(db, order_id, payload.reason)
    except ValueError as e:
        raise errors.bad_request("cancel_error", str(e))
    order_service.attach_order_rating(db, order)
    return order_service.serialize(order)
