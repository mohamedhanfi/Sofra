from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..ws import customer_ws_manager, ws_manager

router = APIRouter()


@router.websocket("/ws/admin/orders")
async def admin_orders_ws(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        await websocket.send_text('{"event":"connected"}')
        while True:
            # Clients mostly listen; handle ping/keepalive and swallow input.
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


@router.websocket("/ws/customer/orders/{conversation_id}")
async def customer_order_ws(websocket: WebSocket, conversation_id: str):
    await customer_ws_manager.connect(conversation_id, websocket)
    try:
        await websocket.send_text('{"event":"connected"}')
        while True:
            # Clients mostly listen; handle ping/keepalive and swallow input.
            await websocket.receive_text()
    except WebSocketDisconnect:
        customer_ws_manager.disconnect(conversation_id, websocket)
    except Exception:
        customer_ws_manager.disconnect(conversation_id, websocket)
