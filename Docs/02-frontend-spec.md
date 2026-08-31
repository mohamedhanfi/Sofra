# Frontend Specification — UI/UX
### Egyptian Restaurant Ordering Platform (V1)

Two separate frontends, one shared visual identity: **Customer Site** and **Owner Dashboard**. Both are built as normal web apps that talk only to the backend REST API — no direct database or LLM access from the browser.

---

## 1. Design Direction (why it matters)

The single biggest risk for a project like this is that it *looks* like a generic AI-generated template — purple-to-blue gradients, the same rounded card everywhere, the same default sans-serif, a floating chat bubble in the bottom-right corner exactly like every SaaS demo. We deliberately avoid all of that.

**Direction:** warm, earthy, "sun-baked" palette drawn from Egyptian food and craft (koshary, spices, clay, brass) rather than tech-startup blue/purple. Restaurant sites that read as authentic in 2026 lean into earth tones, muted terracotta, and confident typography instead of glossy gradients and heavy shadows (this mirrors what's currently working across restaurant sites more broadly — earthy, editorial palettes rather than saturated tech-blue ones).

### 1.1 Color Palette

| Role | Color | Hex | Notes |
|---|---|---|---|
| Primary (brand) | Deep Terracotta | `#B5502F` | Buttons, active states, agent bubble accent — replaces the "AI purple" |
| Primary Dark | Burnt Clay | `#7A3620` | Hover/pressed states, headers |
| Secondary | Spice Gold | `#C79A3C` | Highlights, badges (e.g. "Popular"), owner-dashboard accents |
| Accent (sparingly) | Deep Olive | `#5B6B3F` | Availability tags, success states — not green #22c55e (too "SaaS") |
| Base / Background | Warm Cream | `#F6EFE4` | Page background instead of stark white |
| Surface | Off-White Card | `#FFFDF9` | Cards, chat panel |
| Text Primary | Charcoal Brown | `#2B2320` | Body text — warmer than pure black |
| Text Muted | Warm Gray | `#8A7F73` | Secondary text, timestamps |
| Error | Brick Red | `#9C3B2E` | Errors, "unavailable", cancel actions |
| Divider | Sand Line | `#E4D8C4` | Borders, table lines |

No blue/purple gradient anywhere. No neon accent. No glassmorphism. Flat, warm, confident.

### 1.2 Typography

- **Headings:** a serif or slab-serif with character (e.g. "Zilla Slab", "Fraunces", or "Cairo" weight 700 for Arabic) — avoids the generic geometric-sans look of AI templates.
- **Body:** a humanist sans (e.g. "Inter" for Latin, "Cairo" or "Noto Kufi Arabic" for Arabic) — legible at small sizes for menu text and chat.
- Arabic and English must both be first-class: the layout mirrors (RTL) automatically when the customer's language is Arabic, including the chat bubble alignment and cart drawer.

### 1.3 Texture & Motifs (used sparingly, not everywhere)

- Thin hand-drawn-style divider lines instead of drop shadows to separate sections.
- A subtle repeating geometric motif (inspired by Mamluk/Islamic geometric patterns, very low opacity ~4-6%) as a background texture on the hero section only — not on every card.
- Real food photography over illustration or 3D-render icons. No stock "robot" or "AI sparkle" icons anywhere in the customer-facing UI — the agent is presented as "Order Assistant," never branded as "AI" front and center.

---

## 2. Customer Site

### 2.1 Site Map

```
/                 → Home (hero, highlights, quick links to Menu + Chat)
/menu             → Full menu, browsable by category, with search
/order            → Chat/Order screen (the AI agent) + persistent cart drawer
/order/:id/status → Order status tracking page
/about            → Restaurant info (hours, address, delivery zones)
```

### 2.2 Home Page
- Hero: full-width food photo, restaurant name, one-line tagline, two buttons: "View Menu" and "Order Now" (opens `/order`).
- Below the fold: 3-4 featured/popular dishes as cards (photo, name, price, "Add" quick action that opens the chat with the item pre-filled).
- Footer: hours, address, phone, social links.

### 2.3 Menu Page
- Category tabs (Mains, Grills, Koshary & Rice, Sandwiches, Drinks, Desserts) — sticky on scroll.
- Each item: photo, name (Arabic + English), short description, price, availability badge (Olive "Available" / Brick-red "Sold out today").
- Clicking an item opens a detail sheet with description + an "Order this" button that jumps into the chat with the item pre-filled — the menu page and the chat are never two disconnected experiences.

### 2.4 Order / Chat Screen — this *is* the ordering flow
Layout: two-pane on desktop, single column with a slide-up cart on mobile.

- **Left/main pane — Conversation.** Chat bubbles styled like a real conversation (terracotta bubble for the assistant, cream bubble for the customer), not a generic chat-widget-in-a-box. Suggested quick-reply chips under the latest agent message (e.g. "Show me the menu", "أيوه أكد الطلب") so customers who don't want to type freely still move fast.
- **Right pane / cart drawer — Live cart.** Updates in real time as the agent adds/removes items: item, quantity, price, a small stepper to adjust quantity directly (which sends the same `update_cart` action the chat would). Subtotal always visible. This gives customers a trustworthy, editable view of state instead of relying purely on chat text — important since the agent is not the source of truth for price (see `01-ai-agent-spec.md` Rule 2 & 5).
- Below the cart: order-type toggle (Delivery / Pickup), address field (only shown for delivery), and a prominent "Review & Confirm" button that surfaces the same confirmation summary the agent would show in chat — belt-and-suspenders so confirmation is never missed.
- On order creation: success state with order number and a "Track your order" link to `/order/:id/status`.

### 2.5 Order Status Page
Simple horizontal stepper matching the lifecycle in `00-project-overview.md` Section 3 (Pending → Preparing → Ready → Out for Delivery/Completed), auto-refreshing every ~15s by polling the backend (no websockets needed for V1).

### 2.6 Mobile Considerations
- Bottom tab bar: Home / Menu / Order (chat) / Status.
- Chat input stays fixed above the keyboard; cart is a swipe-up sheet, not a separate page.
- Tap targets ≥44px; Arabic numerals/price formatting respected (١٢٠ ج.م or 120 EGP depending on language toggle).

---

## 3. Owner Dashboard

Private, authenticated (simple username/password login is enough for V1 — single owner user).

### 3.1 Site Map
```
/login
/dashboard          → Today's summary: order counts by status, quick stats
/orders             → Orders board
/menu               → Menu management (list + add/edit/delete)
/restaurant-info    → Edit hours, address, delivery zones, contact
```

### 3.2 Visual Treatment
Same palette as the customer site but denser and more utilitarian — this is a working tool, not a marketing page. Sand-colored sidebar navigation, terracotta for primary actions, olive/brick-red status pills.

### 3.3 Orders Board
Kanban-style columns matching the lifecycle: **Pending | Preparing | Ready | Out for Delivery | Delivered/Completed** (Cancelled shown in a filterable list, not a column, to keep the board clean).

- Each order card: order #, customer name/phone, item summary, total, order type (delivery/pickup) with a small icon, time since placed.
- Owner moves an order forward with a single click/dropdown (or drag between columns) — this calls `PATCH /orders/:id/status`.
- New pending orders should visually stand out (subtle pulse or gold left-border) and, ideally, a soft notification sound — this is the one place a little urgency in the UI is appropriate, since it's an operational tool, not a marketing surface.
- Click an order card → detail panel with full item list, notes/special-requests text, delivery address if applicable, and a cancel action (with reason).

### 3.4 Menu Management
- Table view grouped by category: photo thumbnail, name (AR/EN), price, availability toggle, edit/delete actions.
- "Add Item" opens a form: name (AR + EN), description, category (dropdown, extensible), price, photo upload, available toggle.
- Availability toggle is instant (single click, optimistic UI) since "mark sold out" needs to be fast during service.
- Price edits take effect immediately for the AI agent's `get_menu`/`calculate_total` tools — no caching layer that could serve stale prices.

### 3.5 Restaurant Info Page
Simple form: opening hours (per day), address, delivery zones (list of areas + optional delivery fee per zone), contact number, payment note ("Cash on delivery/pickup"). Feeds directly into the agent's `get_restaurant_info` tool.

---

## 4. Shared UI Components (build once, reuse across both apps)

| Component | Used in |
|---|---|
| `Button` (primary/secondary/danger variants) | Both |
| `StatusPill` (pending/preparing/ready/etc., color-coded) | Both |
| `MenuItemCard` | Customer menu, Owner menu table |
| `PriceLabel` (handles EGP formatting + AR/EN numerals) | Both |
| `ChatBubble` | Customer chat only |
| `CartLine` (item + qty stepper + price) | Customer cart drawer |
| `Toast` (success/error notifications) | Both |
| `LanguageToggle` (AR/EN + RTL flip) | Customer site (Owner dashboard can default to Arabic-only or a single toggle, simpler for V1) |

---

## 5. Accessibility & Responsiveness Baseline

- Color contrast checked against the palette above (terracotta on cream passes AA for body text at 16px+; verify before shipping).
- All interactive elements reachable by keyboard on desktop; dashboard usable without a mouse for status changes.
- RTL support is not an afterthought — build the customer site RTL-first if the primary audience is Arabic-speaking, then verify the LTR/English mirror, not the other way around.
