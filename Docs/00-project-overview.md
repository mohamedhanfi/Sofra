# Egyptian Restaurant Ordering Platform — Project Overview (V1)

## 1. What We're Building

A full ordering website for an Egyptian-food restaurant with two portals sharing one SQLite database:

1. **Customer Site** — public-facing site where visitors browse the menu, chat with an AI ordering agent, build a cart, and place orders.
2. **Owner Dashboard** — private admin panel where the restaurant owner manages the menu (add/edit/delete items, change prices, toggle availability) and tracks incoming orders through their lifecycle.

This overview ties together three companion documents:

| Document | Covers |
|---|---|
| `01-ai-agent-spec.md` | The conversational AI agent: intents, tools, state, rules |
| `02-frontend-spec.md` | UI/UX for both the customer site and the owner dashboard |
| `03-backend-spec.md` | System architecture, SQLite schema, REST API |

## 2. V1 Goals

- One restaurant, one branch, one language pair (Arabic + English), website only (no WhatsApp/voice yet).
- Customer can chat with the AI agent to browse the menu, ask questions, build a cart, and confirm an order.
- Owner can fully manage the menu and combos, and see orders update live (no manual refresh) as they move through their lifecycle.
- Order status lifecycle: **Pending → In Preparation → Ready → Out for Delivery (if delivery) → Delivered/Completed**, with an optional 1-5 star rating collected right after.
- Returning customers can be recognized by phone number for a quick "same as last time" shortcut — no accounts or passwords.
- Combo/bundle offers (e.g. "Koshary Combo") are a first-class menu concept, not just a discount code.
- The owner gets a lightweight analytics view (revenue, top items, peak hours) built from plain SQL over the existing tables — no separate analytics stack.
- No payment gateway in V1 — orders are confirmed and paid on delivery/pickup (Cash on Delivery), matching how most local Egyptian restaurant sites currently operate.

## 3. Order Status Lifecycle (used across all three docs)

```
pending → preparing → ready → (dine-in/pickup: completed) 
                              (delivery: out_for_delivery → delivered)
cancelled  (can happen from pending or preparing, owner-triggered)
```

| Status | Meaning | Who sets it |
|---|---|---|
| `pending` | Order just created, not yet acknowledged by the kitchen | System, on `create_order` |
| `preparing` | Kitchen is actively preparing it | Owner |
| `ready` | Food is ready (for pickup or dispatch) | Owner |
| `out_for_delivery` | Only for delivery orders, courier has it | Owner |
| `delivered` | Only for delivery orders, confirmed delivered | Owner |
| `completed` | Only for pickup/dine-in orders, handed to customer | Owner |
| `cancelled` | Order cancelled | Owner |

Once an order reaches `delivered` or `completed`, the customer's status page offers a one-time 1-5 star rating (optional, skippable) — this is the only step after the lifecycle above and never blocks or delays it.

## 4. High-Level System Diagram

```
                     ┌─────────────────────┐
                     │   SQLite Database    │
                     │ (menu, orders, cart, │
                     │  restaurant_info)     │
                     └──────────┬───────────┘
                                │
                ┌───────────────┴────────────────┐
                │                                  │
        ┌───────▼────────┐                ┌───────▼────────┐
        │  Backend API    │                │  Backend API    │
        │ (Customer + AI  │◄──────────────►│  (Owner/Admin)  │
        │   Agent routes) │   same server   │      routes     │
        └───────┬────────┘                └───────┬────────┘
                │                                  │
        ┌───────▼────────┐                ┌───────▼────────┐
        │ Customer Site   │                │ Owner Dashboard │
        │  (chat + menu   │                │  (menu mgmt +   │
        │   + cart UI)    │                │  order tracking)│
        └────────────────┘                └────────────────┘
```

The AI Agent lives inside the backend, not the frontend. The frontend only ever talks to backend REST endpoints — it never calls the LLM directly and never touches the database directly. This keeps pricing, availability, and order creation trustworthy (see Design Principle in `01-ai-agent-spec.md`, Section 17).

## 5. Simple Project Folder Structure

Kept intentionally flat — no extra abstraction layers until V2 actually needs them.

```
egyptian-restaurant-platform/
│
├── backend/
│   ├── app/
│   │   ├── main.py                 # app entrypoint, mounts routers
│   │   ├── database.py             # SQLite connection/session setup
│   │   ├── models.py                # ORM models (Item, Combo, ComboItem, Order, OrderItem, Cart, Customer, Rating, RestaurantInfo)
│   │   ├── schemas.py               # request/response validation schemas
│   │   ├── ws.py                     # /ws/admin/orders connection manager
│   │   │
│   │   ├── routers/
│   │   │   ├── chat.py              # POST /chat  (AI agent entrypoint)
│   │   │   ├── menu.py              # public + admin menu & combo endpoints
│   │   │   ├── orders.py            # order creation, status, rating endpoints
│   │   │   ├── customers.py         # last-order lookup by phone
│   │   │   ├── analytics.py         # admin analytics summary
│   │   │   └── restaurant.py        # restaurant info endpoints
│   │   │
│   │   ├── agent/
│   │   │   ├── agent.py             # RestaurantAgent class, process_message()
│   │   │   ├── state.py             # AgentState
│   │   │   ├── prompts.py           # system prompt
│   │   │   └── tools.py             # get_menu, get_combos, add_to_cart, calculate_total, create_order, etc.
│   │   │
│   │   └── services/
│   │       ├── menu_service.py      # menu CRUD used by both agent tools and admin API
│   │       ├── combo_service.py
│   │       ├── cart_service.py
│   │       ├── order_service.py
│   │       ├── customer_service.py
│   │       └── analytics_service.py
│   │
│   ├── restaurant.db                # SQLite database file
│   ├── requirements.txt
│   └── .env                          # LLM API key, config
│
├── frontend-customer/
│   ├── src/
│   │   ├── pages/                    # Home, Menu, Chat/Order, OrderStatus (incl. rating prompt)
│   │   ├── components/               # ChatWidget, MenuCard, ComboCard, CartDrawer, ConfirmModal, RatingStars
│   │   ├── styles/                   # theme.css (colors, fonts)
│   │   └── api/                      # fetch wrappers to backend
│   └── package.json
│
├── frontend-owner/
│   ├── src/
│   │   ├── pages/                    # Login, Dashboard, MenuManagement, ComboManagement, OrdersBoard, Analytics
│   │   ├── components/               # ItemForm, ComboForm, OrderCard, StatusDropdown, LiveIndicator, AnalyticsChart
│   │   ├── styles/
│   │   └── api/                      # includes a ws.js socket client for /ws/admin/orders
│   └── package.json
│
└── docs/
    ├── 00-project-overview.md
    ├── 01-ai-agent-spec.md
    ├── 02-frontend-spec.md
    └── 03-backend-spec.md
```

No microservices, no message queues, no multi-branch tables — all of that is explicitly deferred to V2 to keep V1 shippable.

## 6. Build Order (recommended)

1. `backend/` — database + models + menu/order services (no AI yet, plain CRUD APIs).
2. `frontend-owner/` — menu management + orders board, wired to the plain CRUD APIs. This gets the restaurant operational even before the AI agent exists.
3. `backend/app/agent/` — the AI agent layer, wired on top of the same services.
4. `frontend-customer/` — chat + menu browsing + cart UI, wired to `/chat` and the public menu/order APIs.
5. Integration testing of the full flow in `01-ai-agent-spec.md` Section 16 (Definition of Done).
