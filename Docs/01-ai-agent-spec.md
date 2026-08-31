# Restaurant AI Agent — V1 Specification
### Egyptian Restaurant Ordering Platform

## 1. Overview

The Restaurant AI Agent is the core intelligence component of the customer-facing ordering system. It's the only thing on the customer site that "talks" — everything else (menu grid, cart drawer) is a normal UI reflection of what the agent and backend already know.

The agent is responsible for:

- Understanding customer messages (Arabic, Egyptian colloquial, or English — customers will mix languages naturally, e.g. "عايز 2 kofta").
- Identifying customer intent.
- Answering restaurant-related questions (hours, address, delivery zones, payment on delivery).
- Retrieving menu information through tools — never from memory.
- Managing the customer's shopping cart.
- Calculating the order total through the tool layer.
- Asking for order confirmation before anything is final.
- Creating the order only after explicit customer confirmation.
- Maintaining conversation and order state across the chat.

## 2. V1 Scope

Website chat only.

**In scope:** restaurant info, menu browsing, item details, availability, combos/bundle offers, add/remove/update cart, calculate total, order confirmation, order creation, returning-customer recognition by phone number, basic conversation context, bilingual Arabic/English replies (agent replies in whichever language the customer is using).

**Out of scope for V1:** WhatsApp integration, voice interaction, payment processing, delivery-courier API integration, POS integration, human handoff, advanced RAG, multi-agent architecture, recommendation engine, live order tracking map, multi-branch management.

## 3. Agent Architecture

```
Customer Message
       |
       v
+------------------+
|  Restaurant      |
|     Agent        |
+--------+---------+
         |
         v
+------------------+
| Intent / Context |
|   Understanding  |
+--------+---------+
         |
         v
+------------------+
|   Tool Selection |
+--------+---------+
         |
         v
+------------------+
| Tool Execution   |
+--------+---------+
         |
         v
+------------------+
| Update Agent     |
| State            |
+--------+---------+
         |
         v
+------------------+
| Generate Response|
+------------------+
```

The LLM never accesses the database directly. All external operations go through controlled tools that call the backend's `menu_service`, `cart_service`, and `order_service`.

## 4. Agent Responsibilities

### 4.1 Restaurant Information
"What time do you open?", "Where are you located?", "Do you deliver to Maadi?", "Cash only?" → `get_restaurant_info`.

### 4.2 Menu Inquiry
"إيه الأكلات المصرية عندكم؟", "Show me the menu", "How much is the koshary?", "Is the mahshi available today?" → `get_menu`, `get_item_details`, `check_availability`.

### 4.3 Ordering
"عايز كشري", "Add two kofta", "I want 3 shawerma and one Coke." The agent must:
1. Identify the requested item (match against real menu names, including common Arabic/English spellings).
2. Verify the item exists.
3. Verify availability.
4. Ask for missing info if needed (size, extras, quantity).
5. Add the item to the cart.

### 4.4 Cart Management
Add item, remove item, change quantity, view current cart, calculate total.
"Add another kofta." / "Remove the fries." / "Make it three." / "بكام الطلب كله؟"

### 4.5 Combos & Bundles
"عندكم عروض؟", "Any combo deals?" → `get_combos`. Combos are shown alongside regular items (e.g. "Koshary Combo — Large Koshary + Drink + Salad — 220 EGP instead of 250 EGP"). Adding a combo to the cart adds all its component items as one line with the combo price; it never gets re-priced as the sum of individual items. If a component of a combo is unavailable, the agent must say so and offer the combo without that item at the regular combo logic defined by `combo_service` (see `03-backend-spec.md`) — never invent a substitute price itself.

### 4.6 Returning Customer Recognition
When a customer provides a phone number (either at the start of an order, or because they've ordered before in this browser and the number is already stored client-side), the agent can call `get_customer_last_order(phone)` to offer a shortcut: "عايز نفس طلب المرة اللي فاتت (2 كشري + مشروب)؟". This is a convenience, not a login system — no password, no account, just a phone-number lookup. If no prior order exists, the agent proceeds normally without mentioning it.

### 4.7 Order Confirmation
Before creating an order, the agent must show:
- Ordered items, quantities, item prices, total price
- Delivery vs. pickup choice, and address if delivery

Example:
```
Your order:
Koshary (Large) × 2 — 180 EGP
Kofta Sandwich × 1 — 90 EGP
Coke × 1 — 25 EGP

Total: 295 EGP
Delivery to: [address] — estimated delivery time: 40-50 min

Would you like to confirm your order?
```

Order must NOT be created before explicit confirmation.

## 5. Agent Tools

### 5.1 `get_menu()`
Returns all items. Output includes `id, name, name_ar, description, price, category, available`.

### 5.2 `get_item_details(item_id)`
Returns full detail for one item, including `name_ar` for Arabic display.

### 5.3 `check_availability(item_id)`
Returns `{item_id, available}`. Must run before any `add_to_cart`.

### 5.4 `add_to_cart(item_id, quantity, notes?)`
`notes` is optional free text for special requests ("no onions", "extra spicy") — stored but never affects price. Returns the updated cart.

### 5.5 `remove_from_cart(item_id)`

### 5.6 `update_cart(item_id, quantity)`

### 5.7 `calculate_total()`
Returns `{subtotal, delivery_fee, total, currency: "EGP"}`. The LLM must never compute this itself — pricing and delivery fee logic live entirely in `order_service` (see `03-backend-spec.md`).

### 5.8 `create_order(customer_id, cart, order_type, address?)`
`order_type` is `"delivery"` or `"pickup"`. Only callable after explicit confirmation. Returns `{success, order_id, status: "pending", total}`.

### 5.9 `get_restaurant_info()`
Opening hours, address, delivery zones, payment methods (cash on delivery / cash on pickup for V1), contact number.

### 5.10 `get_combos()`
Returns active combo deals: `{id, name, name_ar, items: [item_id...], combo_price, available}`. `available` is `false` automatically if any required component is unavailable (computed by `combo_service`, never by the LLM).

### 5.11 `get_customer_last_order(phone)`
Returns the most recent completed/delivered order for that phone number, or `null`: `{items: [{item_id, name, quantity}], order_type}`. Used only to offer a "same as last time" shortcut — never auto-adds anything to the cart without the customer confirming.

## 6. Agent State

```python
class RestaurantAgentState:
    conversation_id: str
    customer_id: str | None
    customer_phone: str | None      # used only for the last-order lookup shortcut
    messages: list
    intent: str | None
    cart: list
    order_type: str | None        # "delivery" | "pickup"
    delivery_address: str | None
    order_total: float
    order_id: int | None
    awaiting_confirmation: bool
    order_confirmed: bool
    language: str                  # "ar" | "en", tracked so replies stay consistent
```

## 7. Conversation Flow

```
START
  |
  v
Receive Customer Message
  |
  v
Understand Intent (+ detect language)
  |
  +---- Restaurant Question ----> get_restaurant_info
  |
  +---- Menu Question ----------> get_menu / get_item_details
  |
  +---- Ordering ---------------> Check Item -> Check Availability -> Add to Cart
  |
  +---- Cart Request ------------> Cart Tool
  |
  v
Update State
  |
  v
Generate Response (in customer's language)
```

## 8. Order Creation Flow

```
Customer Request → Identify Items → Validate Items → Check Availability
→ Add Items To Cart → Calculate Total → Ask Delivery or Pickup
→ Show Order Summary → Ask For Confirmation → Customer Confirmation
→ Create Order → Return Order ID
```

## 9. Confirmation Rules

**Positive:** "Yes", "Confirm", "تمام", "أيوه" "Place the order", "Go ahead" — only triggers `create_order()` when `awaiting_confirmation` is true.

**Negative:** "No", "Cancel", "لسه", "Change something" — agent must NOT create the order; allow cart edits instead.

## 10. Critical Business Rules

1. **No hallucinated menu items.** If an item isn't on the menu: "I couldn't find that on our current menu." Don't invent a substitute unless asked for a recommendation.
2. **No hallucinated prices.** Prices always come from the data layer.
3. **Availability must be verified** before adding to cart.
4. **Confirmation before order creation** — never skip it.
5. **Server-side calculation.** The LLM explains totals; it never computes the source of truth.
6. **Tool failure handling.** Never fabricate success: "I'm sorry, I couldn't check the menu right now. Please try again in a moment." / "معلش حصل عطل بسيط، جرب تاني بعد شوية."

## 11. System Prompt Requirements

```
You are the ordering assistant for [Restaurant Name], an Egyptian restaurant.
Reply in the same language the customer uses (Arabic or English), in a warm,
concise, human tone — not overly formal.

Your responsibilities:
- Help customers browse the menu and answer restaurant questions.
- Help customers build their cart.
- Verify item availability before adding to cart.
- Mention active combos when relevant, using get_combos only.
- Offer a returning customer their last order as a shortcut, never assume it.
- Provide accurate prices and totals using tools only.
- Ask whether the order is delivery or pickup.
- Ask for confirmation before creating an order.

Rules:
1. Never invent menu items, combos, or prices.
2. Never claim an order was created unless create_order succeeded.
3. Never create an order without explicit customer confirmation.
4. Always use tools for menu, availability, combos, and pricing.
5. Ask for missing information (size, quantity, address) when needed.
6. Keep responses short, friendly, and free of robotic phrasing.
7. If a tool fails, say so clearly instead of guessing.
8. Never add a "last order" or combo to the cart without the customer confirming it first.
```

## 12. Example Conversations

**Simple order**
```
Customer: عايز 2 كشري
Agent: تمام! ضفت 2 كشري للعربيه. تحب تكمل طلب ولا كده بس؟

Customer: بس كده. توصيل ولا استلام؟
Agent: توصيل ولا استلام من الفرع؟

Customer: توصيل، العنوان في المعادي شارع 9
Agent: طلبك:
Koshary × 2 — 180 EGP
رسوم التوصيل: 20 EGP
الإجمالي: 200 EGP
تأكد الطلب؟

Customer: أيوه
Agent: تم تأكيد طلبك رقم #1024. هيوصلك خلال 40-50 دقيقة تقريبًا.
```

**Returning customer + combo**
```
Customer: اهلا، رقمي 01012345678
Agent: أهلاً بيك تاني! آخر مرة طلبت 2 كشري + مياه غازية — تحب نفس الطلب ولا حاجة جديدة النهارده؟

Customer: في حاجة جديدة؟
Agent: عندنا عرض كومبو كشري (كشري كبير + مشروب + سلطة) بـ220 جنيه بدل 250. تحب تجربه؟
```

**Unknown item**
```
Customer: عندكم بيتزا؟
Agent: للأسف مش موجودة عندنا دلوقتي، بس ممكن أعرض عليك الأصناف اللي شبهها زي الفطير المشلتت.
```

**Unavailable item**
```
Customer: عايز فتة
Agent: للأسف الفتة مش متاحة النهاردة. تحب أعرض لك أطباق تانية متاحة؟
```

## 13. Error Handling

Must gracefully handle: unknown item, unavailable item, invalid quantity, tool failure, database failure, ambiguous request, missing info, invalid confirmation.

```
Customer: عايز برجر
Agent: عندنا برجر لحمة وبرجر فراخ — تحب أي واحد؟
```

## 14. Implementation Order

1. `agent/state.py` — agent state
2. `agent/tools.py` — menu + cart/order tools (wrapping the shared services from `03-backend-spec.md`)
3. `agent/prompts.py` — system prompt
4. `agent/agent.py` — RestaurantAgent class
5. `process_message()` — conversation processing
6. Confirmation logic (`awaiting_confirmation`, `order_confirmed`)
7. Add `get_combos()` and `get_customer_last_order()` tools once the core flow works
8. Test complete ordering flows end to end, in both Arabic and English, including a combo purchase and a returning-customer shortcut

## 15. Agent Interface

```python
response = agent.process_message(
    conversation_id="conv_123",
    customer_id="customer_42",
    message="عايز 2 كشري"
)
```

```python
{
    "message": "تمام! ضفت 2 كشري للعربيه...",
    "conversation_id": "conv_123",
    "cart": [...],
    "total": 200,
    "awaiting_confirmation": False,
    "order_id": None
}
```

## 16. V1 Definition of Done

The agent reliably completes: browse menu → order items → check availability → add to cart → calculate total → choose delivery/pickup → show summary → get confirmation → create order → return order ID — in both Arabic and English, before any V2 feature work begins.

## 17. Design Principle

> **LLM for understanding and conversation. Tools and application logic for truth and business operations.**

```
LLM                              Tools / Services
 ├── Understand customer          ├── Menu truth
 ├── Decide which tool to use     ├── Availability
 └── Generate natural response    ├── Cart
                                   ├── Price calculation
                                   └── Order creation
```

This separation is preserved in later versions so the agent can extend to WhatsApp, voice, or multi-branch without redesigning core business logic.
