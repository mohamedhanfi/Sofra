"""System prompt (kept for a future LLM swap) and bilingual reply templates.

V1 uses a rule-based agent, so the "system prompt" below is behavioural
documentation; the actual intents are dispatched in agent.py. Keeping the text
here lets later versions swap in an LLM engine with the same tool contract.
"""

SYSTEM_PROMPT = """\
You are the ordering assistant for an Egyptian restaurant named Sofra.

Reply in the same language the customer uses (Arabic or English), in a warm,
concise, human tone. Your job:
- Help customers browse the menu and answer restaurant questions.
- Build a cart and answer availability/pricing questions using tools only.
- Never invent menu items or prices.
- Verify availability before adding to cart.
- Ask delivery vs pickup, then require confirmation before creating an order.
- Create the order only after explicit confirmation.
- Offer a returning customer (by phone) their last order as a shortcut, never
  auto-add to the cart.
"""

BILINGUAL = {
    "greeting": {
        "ar": "أهلاً بيك في صوفرا! 🍽️ تحب تشوف القائمة، ولا عندك سؤال عن الفرع؟",
        "en": "Welcome to Sofra! Want to see the menu, or ask about the restaurant?",
    },
    "menu": {
        "ar": "دي قائمة الأكل عندنا:\n{menu}",
        "en": "Here's our menu:\n{menu}",
    },
    "restaurant": {
        "ar": "الفرع: {address}\nالتليفون: {phone}\nملاحظة الدفع: {payment}",
        "en": "Address: {address}\nPhone: {phone}\nPayment: {payment}",
    },
    "unknown_item": {
        "ar": "للأسف مش لاقي ده في القائمة بتاعتنا حاليًا. تحب تشوف باقي الأصناف؟",
        "en": "I couldn't find that on our current menu. Would you like to see what we have?",
    },
    "unavailable": {
        "ar": "للأسف {name} مش متاح النهاردة. تحب تختار حاجة تانية؟",
        "en": "Sorry, {name} isn't available today. Would you like something else?",
    },
    "added": {
        "ar": "تمام! ضفت {qty} {name} للعربية. تحب تطلب حاجة تانية؟",
        "en": "Done! I added {qty} x {name} to your cart. Anything else?",
    },
    "cart": {
        "ar": "عربيتك دلوقتي:\n{cart}\nالإجمالي: {total} جنيه",
        "en": "Your cart:\n{cart}\nTotal: {total} EGP",
    },
    "ask_type": {
        "ar": "تحب توصيل ولا استلام من الفرع؟",
        "en": "Would you like delivery or pickup?",
    },
    "need_address": {
        "ar": "تمام، توصيل. اكتب لي العنوان من فضلك.",
        "en": "Sure, delivery. Please share your address.",
    },
    "summary": {
        "ar": "طلبك:\n{cart}\nرسوم التوصيل: {delivery_fee} جنيه\nالإجمالي: {total} جنيه\nتأكد الطلب؟",
        "en": "Your order:\n{cart}\nDelivery fee: {delivery_fee} EGP\nTotal: {total} EGP\nConfirm your order?",
    },
    "confirmed": {
        "ar": "تم تأكيد طلبك رقم #{id}. هيوصلك خلال 40-50 دقيقة تقريبًا.",
        "en": "Order #{id} confirmed! Arriving in about 40–50 minutes.",
    },
    "cancelled_confirm": {
        "ar": "تمام، ما انعكش حاجة. ممكن نعدل عربية التسوق في أي وقت.",
        "en": "No problem, nothing was ordered. You can edit your cart anytime.",
    },
    "repeated_order_offer": {
        "ar": "أهلاً بيك تاني! آخر مرة طلبت {items}. تحب تكرر نفس الطلب ولا حاجة جديدة؟",
        "en": "Welcome back! Last time you ordered {items}. Would you like the same again or something new?",
    },
    "combo_offer": {
        "ar": "عندنا عروض: {combos} تحب تجرب واحدة؟",
        "en": "We have combo deals: {combos} Want to try one?",
    },
    "error": {
        "ar": "معلش حصل عطل بسيط، جرب تاني بعد شوية.",
        "en": "Sorry, something went wrong. Please try again in a moment.",
    },
    "help": {
        "ar": "ممكن تطلب زي:\n- «وريني المنيو»\n- «عايز 2 كشري»\n- «كام الطلب كله؟»\n- «توصيل»",
        "en": "Try asking like:\n- 'Show me the menu'\n- 'I want 2 koshary'\n- 'What's my total?'\n- 'Delivery'",
    },
}


def t(key: str, language: str, **kwargs) -> str:
    text = BILINGUAL[key][language]
    return text.format(**kwargs) if kwargs else text
