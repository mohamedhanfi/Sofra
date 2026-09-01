"""Connection manager + broadcast helper for the /ws/admin/orders websocket.

The Owner Dashboard subscribes here instead of polling so new pending orders and
status moves appear instantly. Services call synchronously (a sync service layer
is used so the AI agent and REST routes share one implementation of truth), and
the actual websocket send is scheduled as an asyncio task since the DB layer is
synchronous.
"""

import asyncio
import json
from typing import Any

from fastapi import WebSocket

# The app's running event loop, set once at startup (see main.py lifespan).
# Needed so sync service code (running in a worker thread) can safely schedule
# websocket broadcasts on the same loop that owns the active connections.
_running_loop: asyncio.AbstractEventLoop | None = None


def set_running_loop(loop: asyncio.AbstractEventLoop | None) -> None:
    global _running_loop
    _running_loop = loop


class ConnectionManager:
    def __init__(self) -> None:
        self.active: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active:
            self.active.remove(websocket)

    async def broadcast(self, event: str, payload: dict) -> None:
        message = json.dumps({"event": event, **payload})
        dead: list[WebSocket] = []
        for websocket in self.active:
            try:
                await websocket.send_text(message)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self.disconnect(websocket)


ws_manager = ConnectionManager()


class CustomerConnectionManager:
    """Tracks order-status websockets per conversation_id.

    Each customer order-status page subscribes here so status changes pushed by
    the owner render instantly instead of the customer polling.
    """

    def __init__(self) -> None:
        self.active: dict[str, set[WebSocket]] = {}

    async def connect(self, conversation_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.setdefault(conversation_id, set()).add(websocket)

    def disconnect(self, conversation_id: str, websocket: WebSocket) -> None:
        conns = self.active.get(conversation_id)
        if conns:
            conns.discard(websocket)
            if not conns:
                self.active.pop(conversation_id, None)

    async def broadcast(self, conversation_id: str, event: str, payload: dict) -> None:
        message = json.dumps({"event": event, **payload})
        dead: list[WebSocket] = []
        for websocket in list(self.active.get(conversation_id, ())):
            try:
                await websocket.send_text(message)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self.disconnect(conversation_id, websocket)


customer_ws_manager = CustomerConnectionManager()


def _schedule(coro) -> None:
    """Schedule a coroutine on the app's running loop from a worker thread."""
    loop = _running_loop
    if loop is None:
        return
    asyncio.run_coroutine_threadsafe(coro, loop)


def serialize_order(order: Any) -> dict:
    return {
        "id": order.id,
        "order_type": order.order_type,
        "status": order.status,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "delivery_address": order.delivery_address,
        "subtotal": order.subtotal,
        "delivery_fee": order.delivery_fee,
        "total": order.total,
        "created_at": order.created_at.isoformat() if order.created_at else None,
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
    }


def notify_order_created(order: Any) -> None:
    """Schedule an order_created broadcast for the given Order."""
    payload = {"order": serialize_order(order)}
    _schedule(ws_manager.broadcast("order_created", payload))


def notify_status_changed(order: Any) -> None:
    """Schedule a status_changed broadcast for the given Order."""
    payload = {"order": serialize_order(order)}
    _schedule(ws_manager.broadcast("status_changed", payload))


def notify_customer_status(order: Any) -> None:
    """Schedule a status_changed push to customer sockets for this order's conversation."""
    if not getattr(order, "conversation_id", None):
        return
    payload = {"order": serialize_order(order)}
    _schedule(customer_ws_manager.broadcast(order.conversation_id, "status_changed", payload))
