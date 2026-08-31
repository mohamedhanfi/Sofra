# Backend Specification — Architecture, Database & API
### Egyptian Restaurant Ordering Platform (V1)

## 1. Architecture Overview

A single backend service exposes REST endpoints to both the Customer Site and the Owner Dashboard, and hosts the AI Agent internally. One SQLite database is the single source of truth for menu, cart, and orders.

```
Customer Site  ──┐                          ┌── SQLite (restaurant.db)
                  ├──►  Backend API (REST) ──┤
Owner Dashboard ──┘        │                 └── (menu, orders, order_items,
                            │                       cart_items, restaurant_info)
                      ┌─────▼─────┐
                      │ AI Agent   │
                      │ (uses the  │
                      │ same       │
                      │ services)  │
                      └───────────┘
```

Key rule carried over from the agent spec: **the LLM never touches the database.** The agent's tools call the exact same `menu_service` / `cart_service` / `order_service` functions that the plain REST endpoints call. This guarantees the AI agent and the owner dashboard can never disagree about price or availability — there's one implementation of "truth," used two ways.

## 2. Tech Choices (keep it simple)

- **Language/framework:** any REST-capable backend framework works; examples below use Python/FastAPI-style pseudocode since it pairs naturally with SQLite and an LLM SDK, but the schema and API contract are framework-agnostic.
- **Database:** SQLite (single file, `restaurant.db`) — sufficient for V1 (one restaurant, one branch, moderate order volume). A migration path to Postgres is possible later without changing the API contract.
- **Auth:** simple session/JWT for the owner dashboard only. The customer site is anonymous (identified by a `customer_id`/session id stored client-side), matching V1 scope (no accounts/login for customers).

## 3. Database Schema (SQLite)

```sql
-- Menu items
CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description_en TEXT,
    description_ar TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    photo_url TEXT,
    available INTEGER NOT NULL DEFAULT 1,   -- 0/1 boolean
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Restaurant info (single row table)
CREATE TABLE restaurant_info (
    id INTEGER PRIMARY KEY CHECK (id = 1),   -- enforce single row
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    opening_hours TEXT,        -- JSON string, e.g. {"sat":"12:00-00:00", ...}
    delivery_zones TEXT,       -- JSON string, e.g. [{"area":"Maadi","fee":20}, ...]
    payment_note TEXT DEFAULT 'Cash on delivery/pickup'
);

-- Orders
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    order_type TEXT NOT NULL CHECK (order_type IN ('delivery','pickup')),
    delivery_address TEXT,
    delivery_fee REAL DEFAULT 0,
    subtotal REAL NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','preparing','ready','out_for_delivery','delivered','completed','cancelled')),
    cancel_reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Order line items (snapshot of price at order time — never re-read live price)
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    item_name_en TEXT NOT NULL,
    item_name_ar TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    notes TEXT
);

-- Active cart (pre-order, one active cart per customer/conversation)
CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Notes:
- `order_items` snapshots `item_name`/`unit_price` at order time so a later price change in `items` never rewrites history — critical for correct receipts even after the owner edits prices.
- `cart_items` is keyed by `conversation_id` so the AI agent's in-chat cart and the frontend cart drawer always read the same rows.
- Booleans as `INTEGER 0/1` since SQLite has no native boolean type.

## 4. REST API

Base path: `/api/v1`

### 4.1 Public — Menu (read)
| Method | Path | Purpose |
|---|---|---|
| GET | `/menu` | List all items (optionally `?category=`, `?available_only=true`) |
| GET | `/menu/:id` | Single item detail |
| GET | `/restaurant-info` | Hours, address, delivery zones, payment note |

### 4.2 Public — Cart
| Method | Path | Purpose |
|---|---|---|
| GET | `/cart/:conversation_id` | Current cart contents |
| POST | `/cart/:conversation_id/items` | Add item `{item_id, quantity, notes?}` |
| PATCH | `/cart/:conversation_id/items/:item_id` | Update quantity |
| DELETE | `/cart/:conversation_id/items/:item_id` | Remove item |
| GET | `/cart/:conversation_id/total` | `{subtotal, delivery_fee, total, currency}` |

### 4.3 Public — Orders
| Method | Path | Purpose |
|---|---|---|
| POST | `/orders` | Create order from a cart `{conversation_id, customer_id, order_type, delivery_address?, customer_name?, customer_phone?}` — server re-validates availability & re-computes price server-side, never trusts client-sent totals |
| GET | `/orders/:id` | Order detail + status (used by the status-tracking page, polled) |

### 4.4 AI Agent Endpoint
| Method | Path | Purpose |
|---|---|---|
| POST | `/chat` | `{conversation_id, customer_id, message}` → runs `RestaurantAgent.process_message()`, returns `{message, cart, total, awaiting_confirmation, order_id}` (see `01-ai-agent-spec.md` Section 15) |

### 4.5 Owner Dashboard (auth required)
| Method | Path | Purpose |
|---|---|---|
| POST | `/admin/login` | `{username, password}` → session/JWT |
| GET | `/admin/menu` | Full menu incl. unavailable items |
| POST | `/admin/menu` | Create item |
| PUT | `/admin/menu/:id` | Update item (price, description, category, photo) |
| PATCH | `/admin/menu/:id/availability` | Quick toggle `{available: true/false}` |
| DELETE | `/admin/menu/:id` | Delete item |
| GET | `/admin/orders` | List orders, filterable `?status=`, sorted newest-first |
| PATCH | `/admin/orders/:id/status` | Move order forward `{status}` — server enforces valid transitions (see Section 5) |
| PATCH | `/admin/orders/:id/cancel` | `{reason}` — allowed only from `pending`/`preparing` |
| PUT | `/admin/restaurant-info` | Update hours/address/zones/contact |

## 5. Status Transition Rules (enforced server-side, not just in the UI)

```
pending → preparing → ready → out_for_delivery → delivered      (delivery orders)
pending → preparing → ready → completed                          (pickup orders)
pending/preparing → cancelled                                    (either)
```

Any request to skip a stage (e.g. `pending` → `delivered`) or move backward is rejected with `400 Bad Request`. This is a business rule, not just a UI affordance — the owner dashboard's Kanban board is a view over this rule, not the source of it.

## 6. Service Layer (shared by REST routes and AI agent tools)

- `menu_service`: `list_items()`, `get_item(id)`, `is_available(id)`, `create_item()`, `update_item()`, `delete_item()`, `set_availability()`
- `cart_service`: `get_cart()`, `add_item()`, `update_quantity()`, `remove_item()`, `calculate_total()` — computes `subtotal + delivery_fee` using live prices from `items` and the zone fee from `restaurant_info`
- `order_service`: `create_order()` (re-validates every item's availability and price at the moment of creation, snapshots into `order_items`, clears the cart), `get_order()`, `update_status()` (enforces Section 5 transitions), `cancel_order()`

## 7. Error Handling Conventions

- `404` — item/order/conversation not found.
- `409 Conflict` — item became unavailable between cart-add and order-create; response includes which item(s) failed so the agent/UI can explain it, not silently drop them.
- `400` — invalid status transition, invalid quantity (≤0), missing required delivery address for `order_type=delivery`.
- All error responses: `{"error": {"code": "...", "message": "..."}}` — kept consistent so the AI agent tool layer can turn any of these into the graceful "I'm sorry, I couldn't..." replies required by the agent spec's Rule 6.

## 8. Security Baseline (V1-appropriate, not over-built)

- Owner routes require auth; customer routes are public but rate-limited per `customer_id`/IP to prevent cart/chat spam.
- Input validation on every write endpoint (price ≥ 0, quantity ≥ 1, valid `order_type`, valid `status` enum).
- No card/payment data handled at all in V1 (cash on delivery/pickup), which removes an entire class of security concerns until V2 introduces online payment.

## 9. Backend Folder Structure

(See `00-project-overview.md` Section 5 for the full project tree; backend-specific detail:)

```
backend/app/
├── main.py            # mounts routers, CORS config for the two frontend origins
├── database.py         # SQLite connection/session
├── models.py            # Item, Order, OrderItem, CartItem, RestaurantInfo
├── schemas.py            # Pydantic-style request/response models
├── routers/
│   ├── chat.py           # POST /chat
│   ├── menu.py            # public + /admin/menu
│   ├── orders.py           # /orders + /admin/orders
│   └── restaurant.py        # /restaurant-info + /admin/restaurant-info
├── agent/
│   ├── agent.py, state.py, prompts.py, tools.py
└── services/
    ├── menu_service.py, cart_service.py, order_service.py
```
