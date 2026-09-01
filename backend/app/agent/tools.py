"""Tool layer wrapping the shared services (03-backend-spec.md).

Tools never touch the DB directly and never invent data. They are the only path
the chat agent (and the frontend cart) use for menu, availability, cart, pricing,
combos, restaurant info, and order creation.
"""

from sqlalchemy.orm import Session

from ..services import cart_service, combo_service, customer_service, menu_service, order_service, restaurant_service


def get_menu(db: Session, language: str) -> list[dict]:
    items = menu_service.list_items(db, available_only=False)
    return [
        {
            "id": it.id,
            "name": it.name_ar if language == "ar" else it.name_en,
            "name_en": it.name_en,
            "name_ar": it.name_ar,
            "description": it.description_ar if language == "ar" else it.description_en,
            "price": it.price,
            "category": it.category,
            "available": it.available,
        }
        for it in items
    ]


def get_item_details(db: Session, item_id: int, language: str) -> dict | None:
    item = menu_service.get_item(db, item_id)
    if not item:
        return None
    return {
        "id": item.id,
        "name": item.name_ar if language == "ar" else item.name_en,
        "name_en": item.name_en,
        "name_ar": item.name_ar,
        "description": item.description_ar if language == "ar" else item.description_en,
        "price": item.price,
        "category": item.category,
        "available": item.available,
    }


def check_availability(db: Session, item_id: int) -> dict:
    return {"item_id": item_id, "available": menu_service.is_available(db, item_id)}


def add_to_cart(db: Session, state, item_id: int, quantity: int, notes: str | None = None) -> list[dict]:
    from ..schemas import CartAddRequestBody

    data = CartAddRequestBody(item_id=item_id, quantity=quantity, notes=notes)
    return cart_service.add_line(db, state.conversation_id, state.customer_id, data)


def remove_from_cart(db: Session, state, item_id: int) -> list[dict]:
    return cart_service.remove_line(db, state.conversation_id, item_id)


def update_cart(db: Session, state, item_id: int, quantity: int) -> list[dict]:
    return cart_service.update_quantity(db, state.conversation_id, item_id, quantity)


def calculate_total(db: Session, state) -> dict:
    total = cart_service.calculate_total(db, state.conversation_id)
    state.order_total = total["total"]
    return total


def get_cart_lines(db: Session, state) -> list[dict]:
    return cart_service.get_cart(db, state.conversation_id)


def create_order(db: Session, state, order_type: str, address: str | None) -> dict:
    from ..schemas import OrderCreate

    payload = OrderCreate(
        conversation_id=state.conversation_id,
        customer_id=state.customer_id,
        order_type=order_type,
        delivery_address=address,
        customer_name=state.customer_phone,
        customer_phone=state.customer_phone,
    )
    order = order_service.create_order(db, payload)
    return {"success": True, "order_id": order.id, "status": order.status, "total": order.total}


def get_restaurant_info(db: Session) -> dict:
    info = restaurant_service.get_info_dict(db)
    return info or {}


def get_combos(db: Session, language: str) -> list[dict]:
    combos = combo_service.list_combos(db, active_only=True)
    out = []
    for c in combos:
        out.append(
            {
                "id": c["id"],
                "name": c["name_ar"] if language == "ar" else c["name_en"],
                "name_en": c["name_en"],
                "name_ar": c["name_ar"],
                "items_text": ", ".join(i["item_name_en"] for i in c["items"]),
                "combo_price": c["combo_price"],
                "component_sum": c["component_sum"],
                "available": c["available"],
            }
        )
    return out


def get_customer_last_order(db: Session, phone: str) -> dict | None:
    order = customer_service.get_last_order(db, phone)
    if not order:
        return None
    return {
        "order_id": order.id,
        "order_type": order.order_type,
        "items": [
            {
                "item_id": oi.item_id,
                "name": oi.item_name_en,
                "quantity": oi.quantity,
            }
            for oi in order.items
        ],
    }
