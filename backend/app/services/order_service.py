from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .. import ws
from ..models import Order, OrderItem, Rating
from . import cart_service, combo_service, customer_service, menu_service

# Valid transitions (Docs/03-backend-spec.md Section 5)
TRANSITIONS = {
    "pending": ["preparing", "cancelled"],
    "preparing": ["ready", "cancelled"],
    "ready": ["out_for_delivery", "completed"],
    "out_for_delivery": ["delivered"],
    "delivered": [],
    "completed": [],
    "cancelled": [],
}


def serialize(order: Order) -> dict:
    return {
        "id": order.id,
        "conversation_id": order.conversation_id,
        "order_type": order.order_type,
        "status": order.status,
        "subtotal": order.subtotal,
        "delivery_fee": order.delivery_fee,
        "total": order.total,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "delivery_address": order.delivery_address,
        "cancel_reason": order.cancel_reason,
        "items": [
            {
                "id": oi.id,
                "item_name_en": oi.item_name_en,
                "item_name_ar": oi.item_name_ar,
                "quantity": oi.quantity,
                "unit_price": oi.unit_price,
            }
            for oi in order.items
        ],
        "rating": _get_rating(order),
    }


def _get_rating(order: Order) -> dict | None:
    rating = getattr(order, "_rating", None)
    if rating:
        return {"stars": rating.stars, "comment": rating.comment}
    return None


def attach_orders_rating(db: Session, orders: list[Order]) -> None:
    """Attach ratings to orders (used by admin list / customer last order)."""
    for order in orders:
        rating = db.scalar(select(Rating).where(Rating.order_id == order.id))
        order._rating = rating


def attach_order_rating(db: Session, order: Order) -> None:
    rating = db.scalar(select(Rating).where(Rating.order_id == order.id))
    order._rating = rating


def get_order(db: Session, order_id: int) -> Order | None:
    return db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )


def get_order_by_conversation(db: Session, conversation_id: str) -> Order | None:
    return db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.conversation_id == conversation_id)
        .order_by(Order.id.desc())
    )


def list_orders(db: Session, order_type: str | None = None, status: str | None = None) -> list[Order]:
    q = select(Order).options(selectinload(Order.items))
    if order_type:
        q = q.where(Order.order_type == order_type)
    if status:
        q = q.where(Order.status == status)
    q = q.order_by(Order.created_at.desc(), Order.id.desc())
    return list(db.scalars(q).all())


def create_order(db: Session, payload) -> dict:
    lines = cart_service.get_cart(db, payload.conversation_id)
    if not lines:
        raise ValueError("Cart is empty.")

    if payload.order_type not in ("delivery", "pickup"):
        raise ValueError("Invalid order type.")
    if payload.order_type == "delivery" and not payload.delivery_address:
        raise ValueError("Delivery address is required for delivery orders.")

    # Server-side availability & price check (never trust client totals).
    unavailable: list[str] = []
    subtotal = 0.0
    for line in lines:
        if line["type"] == "item":
            item = menu_service.get_item(db, line["id"])
            if not item or not item.available:
                unavailable.append(line["title_en"])
            elif item.price != line["unit_price"]:
                raise ValueError(f"Price changed for {item.name_en} — please refresh the cart.")
        else:
            combo = combo_service.get_combo(db, line["id"])
            if not combo or not combo.active or not combo_service.is_combo_available(db, line["id"]):
                unavailable.append(line["title_en"])
        subtotal += line["unit_price"] * line["quantity"]

    if unavailable:
        raise ValueError("Some items are no longer available: " + ", ".join(set(unavailable)))

    total_struct = cart_service.calculate_total(db, payload.conversation_id)
    delivery_fee = total_struct["delivery_fee"] if payload.order_type == "delivery" else 0

    order = Order(
        conversation_id=payload.conversation_id,
        customer_id=payload.customer_id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        order_type=payload.order_type,
        delivery_address=payload.delivery_address,
        subtotal=round(subtotal, 2),
        delivery_fee=delivery_fee,
        total=round(subtotal + delivery_fee, 2),
        status="pending",
    )
    for line in lines:
        order.items.append(
            OrderItem(
                item_id=line["id"],
                item_name_en=line["title_en"],
                item_name_ar=line["title_ar"],
                quantity=line["quantity"],
                unit_price=line["unit_price"],
            )
        )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Refresh order with items loaded.
    order = get_order(db, order.id)

    cart_service.clear_cart(db, payload.conversation_id)

    if payload.customer_phone:
        customer_service.upsert_customer(
            db, payload.customer_phone, payload.customer_name, order.id
        )

    ws.notify_order_created(order)
    return order


def update_status(db: Session, order_id: int, status: str) -> Order:
    order = get_order(db, order_id)
    if not order:
        raise ValueError("Order not found.")
    if status not in TRANSITIONS:
        raise ValueError("Invalid status.")
    if status == order.status:
        return order
    if status not in TRANSITIONS[order.status]:
        raise ValueError(f"Cannot move order from {order.status} to {status}.")
    order.status = status
    db.commit()
    db.refresh(order)
    order = get_order(db, order.id)
    ws.notify_status_changed(order)
    ws.notify_customer_status(order)
    return order


def cancel_order(db: Session, order_id: int, reason: str) -> Order:
    order = get_order(db, order_id)
    if not order:
        raise ValueError("Order not found.")
    if order.status not in ("pending", "preparing"):
        raise ValueError("Only pending or preparing orders can be cancelled.")
    order.status = "cancelled"
    order.cancel_reason = reason
    db.commit()
    db.refresh(order)
    order = get_order(db, order.id)
    ws.notify_status_changed(order)
    ws.notify_customer_status(order)
    return order


def add_rating(db: Session, order_id: int, stars: int, comment: str | None) -> Rating:
    order = get_order(db, order_id)
    if not order:
        raise ValueError("Order not found.")
    if order.status not in ("delivered", "completed"):
        raise ValueError("Rating is only allowed after the order is delivered or completed.")
    existing = db.scalar(select(Rating).where(Rating.order_id == order_id))
    if existing:
        raise ValueError("Order already has a rating.")
    rating = Rating(order_id=order_id, stars=stars, comment=comment)
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating
