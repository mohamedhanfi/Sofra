from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import CartItem

DEFAULT_DELIVERY_FEE = 20.0


def _db_delivery_fee(db: Session) -> float:
    from . import restaurant_service

    return restaurant_service.delivery_fee(db)


def get_cart(db: Session, conversation_id: str) -> list[dict]:
    rows = list(
        db.scalars(
            select(CartItem)
            .where(CartItem.conversation_id == conversation_id)
            .order_by(CartItem.created_at)
        ).all()
    )
    return [_serialize(db, row) for row in rows if _serialize(db, row)]


def _serialize(db: Session, row: CartItem) -> dict | None:
    if row.item_id is not None:
        from ..models import Item

        item = db.get(Item, row.item_id)
        if not item:
            return None
        return {
            "key": f"item-{row.item_id}",
            "type": "item",
            "id": row.item_id,
            "title_en": item.name_en,
            "title_ar": item.name_ar,
            "unit_price": item.price,
            "quantity": row.quantity,
            "photo_url": item.photo_url,
        }
    if row.combo_id is not None:
        from . import combo_service

        combo = combo_service.get_combo(db, row.combo_id)
        if not combo:
            return None
        return {
            "key": f"combo-{row.combo_id}",
            "type": "combo",
            "id": row.combo_id,
            "title_en": combo.name_en,
            "title_ar": combo.name_ar,
            "unit_price": combo.combo_price,
            "quantity": row.quantity,
            "photo_url": combo.photo_url,
        }
    return None


def add_line(db: Session, conversation_id: str, customer_id: str, data) -> list[dict]:
    if (data.item_id is None) == (data.combo_id is None):
        raise ValueError("Provide exactly one of item_id or combo_id.")
    if data.quantity <= 0:
        raise ValueError("Quantity must be at least 1.")

    if data.item_id is not None:
        row = db.scalar(
            select(CartItem).where(
                CartItem.conversation_id == conversation_id,
                CartItem.item_id == data.item_id,
            )
        )
        if row:
            row.quantity += data.quantity
        else:
            row = CartItem(
                conversation_id=conversation_id,
                customer_id=customer_id,
                item_id=data.item_id,
                quantity=data.quantity,
                notes=data.notes,
            )
            db.add(row)
    else:
        row = db.scalar(
            select(CartItem).where(
                CartItem.conversation_id == conversation_id,
                CartItem.combo_id == data.combo_id,
            )
        )
        if row:
            row.quantity += data.quantity
        else:
            row = CartItem(
                conversation_id=conversation_id,
                customer_id=customer_id,
                combo_id=data.combo_id,
                quantity=data.quantity,
                notes=data.notes,
            )
            db.add(row)
    db.commit()
    return get_cart(db, conversation_id)


def update_quantity(db: Session, conversation_id: str, key_id: int, quantity: int) -> list[dict]:
    """key_id is the item_id or combo_id depending on line type; we resolve it."""
    if quantity <= 0:
        raise ValueError("Quantity must be at least 1.")
    row = db.scalar(
        select(CartItem).where(
            CartItem.conversation_id == conversation_id,
            (CartItem.item_id == key_id) | (CartItem.combo_id == key_id),
        )
    )
    if row:
        row.quantity = quantity
        db.commit()
    return get_cart(db, conversation_id)


def remove_line(db: Session, conversation_id: str, key_id: int) -> list[dict]:
    row = db.scalar(
        select(CartItem).where(
            CartItem.conversation_id == conversation_id,
            (CartItem.item_id == key_id) | (CartItem.combo_id == key_id),
        )
    )
    if row:
        db.delete(row)
        db.commit()
    return get_cart(db, conversation_id)


def clear_cart(db: Session, conversation_id: str) -> None:
    rows = db.scalars(select(CartItem).where(CartItem.conversation_id == conversation_id)).all()
    for row in rows:
        db.delete(row)
    db.commit()


def calculate_total(db: Session, conversation_id: str) -> dict:
    lines = get_cart(db, conversation_id)
    subtotal = sum(l["unit_price"] * l["quantity"] for l in lines)
    delivery_fee = _db_delivery_fee(db) if subtotal > 0 else 0
    return {
        "subtotal": round(subtotal, 2),
        "delivery_fee": delivery_fee,
        "total": round(subtotal + delivery_fee, 2),
        "currency": "EGP",
    }
