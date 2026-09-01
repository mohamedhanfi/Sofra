"""Seed initial data into an empty database.

Run on startup (from main.py) only if the DB has no items yet, so owner edits are
never clobbered on restart.
"""

from .database import SessionLocal
from .models import Combo, ComboItem, Item, RestaurantInfo


def _seed_items(db):
    items = [
        Item(name_en="Koshary", name_ar="كشري", price=45, category="Main Dishes",
             description_en="The classic Egyptian street dish, rich and satisfying.",
             description_ar="الطبق المصري الشعبي الشهير.", available=True),
        Item(name_en="Ful Medames", name_ar="فول مدمس", price=35, category="Breakfast",
             description_en="Slow-cooked fava beans with olive oil and spices.",
             description_ar="فول مدمس بالزيت والتوابل.", available=True),
        Item(name_en="Ta’ameya", name_ar="طعمية", price=30, category="Breakfast",
             description_en="Crispy falafel patties served with fresh veggies.",
             description_ar="أقراص الطعمية المقرمشة.", available=True),
        Item(name_en="Molokhia", name_ar="ملوخية", price=60, category="Main Dishes",
             description_en="Green soup with garlic, served with rice and chicken.",
             description_ar="شوربة الملوخية الخضراء.", available=True),
        Item(name_en="Grilled Chicken", name_ar="فراخ مشوية", price=120, category="Grills",
             description_en="Charcoal-grilled chicken with garlic sauce and rice.",
             description_ar="فراخ مشوية بالثومية والأرز.", available=True),
        Item(name_en="Kofta", name_ar="كفتة", price=95, category="Grills",
             description_en="Seasoned minced meat skewers with tahini.",
             description_ar="أسياخ الكفتة بالطحينة.", available=True),
        Item(name_en="Baklava", name_ar="بقلاوة", price=25, category="Desserts",
             description_en="Sweet flaky pastry with nuts and honey.",
             description_ar="بقلاوة بالمكسرات والعسل.", available=True),
        Item(name_en="Om Ali", name_ar="أم علي", price=40, category="Desserts",
             description_en="Warm Egyptian bread pudding with nuts and cream.",
             description_ar="أم علي بالقشطة والمكسرات.", available=True),
        Item(name_en="Mint Tea", name_ar="شاي بالنعناع", price=15, category="Drinks",
             description_en="Fresh mint tea, perfectly sweetened.",
             description_ar="شاي بالنعناع الطازج.", available=True),
        Item(name_en="Mango Juice", name_ar="عصير مانجو", price=35, category="Drinks",
             description_en="Thick fresh mango juice.",
             description_ar="عصير مانجو طبيعي.", available=True),
    ]
    db.add_all(items)
    db.flush()
    return items


def _seed_combos(db, items_by_name):
    combo = Combo(
        name_en="Koshary Combo Meal", name_ar="وجبة كشري كومبو",
        combo_price=60, active=True,
    )
    combo.items.append(ComboItem(item_id=items_by_name["Koshary"].id, quantity=1))
    combo.items.append(ComboItem(item_id=items_by_name["Mint Tea"].id, quantity=1))
    db.add(combo)


def _seed_restaurant(db):
    info = db.get(RestaurantInfo, 1)
    if not info:
        db.add(RestaurantInfo(
            id=1,
            name="Sofra",
            address="12 Nile Street, Downtown, Cairo",
            phone="+20 100 000 0000",
            payment_note="Cash on delivery / pickup",
        ))


def seed_if_empty():
    db = SessionLocal()
    try:
        has_items = db.query(Item.id).first()
        if has_items:
            return
        items = _seed_items(db)
        items_by_name = {i.name_en: i for i in items}
        _seed_combos(db, items_by_name)
        _seed_restaurant(db)
        db.commit()
    finally:
        db.close()
