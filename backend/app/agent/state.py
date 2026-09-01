"""In-memory per-conversation agent state (matches 01-ai-agent-spec.md Section 6).

State is deliberately kept in-process. It is keyed by conversation_id so the
customer's chat and the frontend cart drawer read the same cart rows (the cart
itself lives in the cart_items table, keyed by conversation_id).
"""

from dataclasses import dataclass, field


@dataclass
class RestaurantAgentState:
    conversation_id: str
    customer_id: str
    customer_phone: str | None = None
    language: str = "en"
    order_type: str | None = None
    delivery_address: str | None = None
    order_total: float = 0.0
    order_id: int | None = None
    awaiting_confirmation: bool = False
    order_confirmed: bool = False
    pending_item: dict | None = None
    last_action_greeting: bool = False


_state_store: dict[str, RestaurantAgentState] = {}


def get_state(conversation_id: str, customer_id: str) -> RestaurantAgentState:
    state = _state_store.get(conversation_id)
    if state is None:
        state = RestaurantAgentState(
            conversation_id=conversation_id, customer_id=customer_id
        )
        _state_store[conversation_id] = state
    return state


def clear_state(conversation_id: str) -> None:
    _state_store.pop(conversation_id, None)
