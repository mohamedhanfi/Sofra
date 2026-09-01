"""Rule-based RestaurantAgent (V1).

Implements process_message() per 01-ai-agent-spec.md. It detects language and
intent from keywords, always uses the tools in tools.py for data/pricing truth,
enforces the availability + confirmation rules, and returns the documented
response shape: {message, conversation_id, cart, total, awaiting_confirmation,
order_id}.
"""

import re

from sqlalchemy.orm import Session

from . import prompts, tools
from .state import RestaurantAgentState, get_state

ARABIC_RE = re.compile(r"[\u0600-\u06FF]")
DIGITS = "٠١٢٣٤٥٦٧٨٩"
DIGIT_MAP = str.maketrans(DIGITS, "0123456789")
PHONE_RE = re.compile(r"(\+?\d[\d\s-]{8,14}\d)")


def _detect_language(message: str) -> str:
    return "ar" if ARABIC_RE.search(message) else "en"


def _qty(message: str) -> int | None:
    normalized = message.translate(DIGIT_MAP)
    ar_word = re.search(r"(?:عايز|احنا عايزين)\s*(\d+)|(\d+)\s*(?:كشري|طعمية)", normalized)
    for m in (ar_word,):
        if m:
            num = m.group(1) or m.group(2)
            if num:
                q = int(num)
                return max(1, min(q, 20))
    return None


AFFIRM = ["yes", "confirm", "ok", "okay", "place", "go ahead", "sss", "aioh", "aywah",
          "تمام", "أيوه", "أيوة", "موافق", "تمام كده", "اه", "ايوه", "اكد", "أكّد"]
NEGATE = ["no", "cancel", "not yet", "change", "لسه", "لا", "غير", "الغاء", "إلغاء", "مش", "لأ"]


def _contains_any(message: str, words) -> bool:
    low = message.lower()
    return any(w in low for w in words)


class RestaurantAgent:
    def process_message(self, db: Session, conversation_id: str, customer_id: str, message: str) -> dict:
        state = get_state(conversation_id, customer_id)
        state.language = _detect_language(message)
        msg = message.lower()
        lang = state.language

        # ---- Confirmation gate ----
        if state.awaiting_confirmation:
            if _contains_any(msg, AFFIRM):
                return self._confirm_order(db, state)
            if _contains_any(msg, NEGATE):
                state.awaiting_confirmation = False
                state.order_type = None
                state.delivery_address = None
                return self._respond(
                    db, state, prompts.t("cancelled_confirm", lang)
                )

        # ---- Capture address while awaiting it ----
        if state.order_type == "delivery" and state.awaiting_confirmation is False and self._looks_like_address(msg):
            state.delivery_address = message.strip()
            state.awaiting_confirmation = True
            return self._respond(db, state, self._summary(db, state))

        # ---- Phone / returning customer ----
        phone = self._capture_phone(message)
        if phone and not state.customer_phone:
            state.customer_phone = phone
            last = tools.get_customer_last_order(db, phone)
            if last:
                items_text = ", ".join(f"{l['name']} x{l['quantity']}" for l in last["items"])
                return self._respond(db, state, prompts.t("repeated_order_offer", lang, items=items_text))
            return self._respond(db, state, prompts.t("help", lang))

        # ---- Delivery / pickup intent ----
        if _contains_any(msg, ["توصيل", "diliver", "deliver", "home"]) or self._looks_like_address(msg):
            state.order_type = "delivery"
            if self._looks_like_address(msg):
                state.delivery_address = message.strip()
                state.awaiting_confirmation = True
                return self._respond(db, state, self._summary(db, state))
            return self._respond(db, state, prompts.t("need_address", lang))
        if _contains_any(msg, ["استلام", "pickup", "at the branch", "من الفرع"]):
            state.order_type = "pickup"
            state.awaiting_confirmation = True
            return self._respond(db, state, self._summary(db, state))

        # ---- Greeting / help ----
        if _contains_any(msg, ["اهلا", "مرحبا", "السلام", "hello", "hi", "good morning", "good evening", "ازيك"]):
            return self._respond(db, state, prompts.t("greeting", lang))
        if _contains_any(msg, ["help", "مساعدة", "امسك"]):
            return self._respond(db, state, prompts.t("help", lang))

        # ---- Combos ----
        if _contains_any(msg, ["عرض", "كومبو", "combo", "deal", "offers", "عروض"]):
            combos = tools.get_combos(db, lang)
            if not combos:
                return self._respond(db, state, prompts.t("unknown_item", lang))
            text = "\n".join(f"- {c['name']}: {c['combo_price']} EGP ({c['items_text']})" for c in combos)
            return self._respond(db, state, prompts.t("combo_offer", lang, combos=text))

        # ---- Restaurant info ----
        if _contains_any(msg, ["ساعات", "عنوان", "تليفون", "فين", "open", "close", "hour", "address", "where", "phone", "location", "deliver"]):
            info = tools.get_restaurant_info(db)
            if info.get("address"):
                return self._respond(db, state, prompts.t("restaurant", lang,
                    address=info.get("address"), phone=info.get("phone", "-"), payment=info.get("payment_note", "-")))
            return self._respond(db, state, prompts.t("help", lang))

        # ---- Menu / details ----
        if _contains_any(msg, ["منيو", "قائمة", "menu", "اكل", "list"]):
            items = tools.get_menu(db, lang)
            text = "\n".join(f"- {i['name']}: {i['price']} EGP" for i in items)
            return self._respond(db, state, prompts.t("menu", lang, menu=text))

        # ---- Cart & total ----
        if _contains_any(msg, ["كام الطلب", "بكام", "total", "محتاجه", "العربية", "طلبي", "cart", "الطلب كله"]):
            if not tools.get_cart_lines(db, state):
                return self._respond(db, state, prompts.t("cart", lang, cart="_", total="0") + " عربيتك فاضية.")
            return self._respond(db, state, self._cart_text(db, state))
        if _contains_any(msg, ["شيل", "remove", "امسح", "احذف"]):
            item = self._find_item(db, msg)
            if item:
                tools.remove_from_cart(db, state, item["id"])
                return self._respond(db, state, self._cart_text(db, state))
            return self._respond(db, state, prompts.t("unknown_item", lang))

        # ---- Order item ----
        item = self._find_item(db, msg)
        if item:
            if not item["available"]:
                return self._respond(db, state, prompts.t("unavailable", lang, name=item["name"]))
            qty = _qty(msg) or 1
            tools.add_to_cart(db, state, item["id"], qty)
            return self._respond(db, state, prompts.t("added", lang, qty=qty, name=item["name"]))

        # ---- Fallbacks ----
        if _contains_any(msg, ["كام", "سعر", "price", "how much"]):
            items = tools.get_menu(db, lang)
            text = "\n".join(f"- {i['name']}: {i['price']} EGP" for i in items)
            return self._respond(db, state, prompts.t("menu", lang, menu=text))
        if _contains_any(msg, ["أكد", "اكد", "confirm", "تأكيد"]) and tools.get_cart_lines(db, state):
            state.order_type = state.order_type or "pickup"
            state.awaiting_confirmation = True
            return self._respond(db, state, self._summary(db, state))

        return self._respond(db, state, prompts.t("unknown_item", lang))

    # ---- Helpers ----
    def _confirm_order(self, db: Session, state: RestaurantAgentState) -> dict:
        lang = state.language
        lines = tools.get_cart_lines(db, state)
        if not lines:
            state.awaiting_confirmation = False
            return self._respond(db, state, prompts.t("cancelled_confirm", lang))
        order_type = state.order_type or "pickup"
        address = state.delivery_address if order_type == "delivery" else None
        result = tools.create_order(db, state, order_type, address)
        state.order_id = result["order_id"]
        state.awaiting_confirmation = False
        state.order_type = None
        state.delivery_address = None
        return self._respond(db, state, prompts.t("confirmed", lang, id=result["order_id"]))

    def _cart_text(self, db: Session, state: RestaurantAgentState) -> str:
        lines = tools.get_cart_lines(db, state)
        total = tools.calculate_total(db, state)
        text = "\n".join(f"- {l['title_en']} x{l['quantity']} = {l['unit_price'] * l['quantity']}" for l in lines)
        return prompts.t("cart", lang=state.language, cart=text, total=int(total["total"]))

    def _summary(self, db: Session, state: RestaurantAgentState) -> str:
        lines = tools.get_cart_lines(db, state)
        total = tools.calculate_total(db, state)
        delivery_fee = total["delivery_fee"] if state.order_type == "delivery" else 0
        text = "\n".join(f"- {l['title_en']} x{l['quantity']} = {l['unit_price'] * l['quantity']} EGP" for l in lines)
        return prompts.t("summary", lang=state.language, cart=text, delivery_fee=delivery_fee, total=int(total["total"]))

    def _find_item(self, db: Session, msg: str) -> dict | None:
        items = tools.get_menu(db, "en")
        for it in items:
            for name in (it["name_en"], it["name_ar"]):
                if name and name.lower() in msg:
                    return it
        return None

    def _capture_phone(self, message: str) -> str | None:
        matches = PHONE_RE.search(message)
        if not matches:
            return None
        phone = "".join(ch for ch in matches.group(1) if ch.isdigit())
        return phone if 8 <= len(phone) <= 15 else None

    def _looks_like_address(self, message: str) -> bool:
        return any(k in message.lower() for k in ["شارع", "street", "معادي", "مصر الجديدة", "الهرم", "road", "apartment", "عياط", "جيزة"])

    def _respond(self, db: Session, state: RestaurantAgentState, message: str) -> dict:
        cart = tools.get_cart_lines(db, state)
        total = tools.calculate_total(db, state)["total"]
        return {
            "message": message,
            "conversation_id": state.conversation_id,
            "cart": cart,
            "total": total,
            "awaiting_confirmation": state.awaiting_confirmation,
            "order_id": state.order_id,
        }
