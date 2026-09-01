from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..models import Combo, ComboItem, Item


def _load(db: Session, combo_id: int) -> Combo | None:
    return db.scalar(
        select(Combo)
        .options(selectinload(Combo.items).selectinload(ComboItem.item))
        .where(Combo.id == combo_id)
    )


def _component_sum(combo: Combo) -> float:
    total = 0.0
    for ci in combo.items:
        if ci.item:
            total += ci.item.price * ci.quantity
    return total


def _is_available(combo: Combo) -> bool:
    return all(ci.item and ci.item.available for ci in combo.items)


def serialize(combo: Combo) -> dict:
    return {
        "id": combo.id,
        "name_en": combo.name_en,
        "name_ar": combo.name_ar,
        "combo_price": combo.combo_price,
        "photo_url": combo.photo_url,
        "active": combo.active,
        "component_sum": _component_sum(combo),
        "available": _is_available(combo),
        "items": [
            {
                "item_id": ci.item_id,
                "item_name_en": ci.item.name_en if ci.item else "",
                "item_name_ar": ci.item.name_ar if ci.item else "",
                "quantity": ci.quantity,
            }
            for ci in combo.items
        ],
    }


def list_combos(db: Session, active_only: bool = False) -> list[dict]:
    q = select(Combo).options(
        selectinload(Combo.items).selectinload(ComboItem.item)
    )
    if active_only:
        q = q.where(Combo.active.is_(True))
    combos = list(db.scalars(q.order_by(Combo.id)).all())
    return [serialize(c) for c in combos]


def get_combo(db: Session, combo_id: int) -> Combo | None:
    return _load(db, combo_id)


def is_combo_available(db: Session, combo_id: int) -> bool:
    combo = _load(db, combo_id)
    if not combo:
        return False
    return _is_available(combo)


def create_combo(db: Session, data) -> Combo:
    combo = Combo(
        name_en=data.name_en,
        name_ar=data.name_ar,
        combo_price=data.combo_price,
        photo_url=data.photo_url,
        active=data.active,
    )
    for spec in data.items:
        combo.items.append(ComboItem(item_id=spec.item_id, quantity=spec.quantity))
    db.add(combo)
    db.commit()
    db.refresh(combo)
    return _load(db, combo.id)


def update_combo(db: Session, combo_id: int, data) -> Combo | None:
    combo = _load(db, combo_id)
    if not combo:
        return None
    values = data.model_dump(exclude_unset=True)
    items = values.pop("items", None)
    for key, value in values.items():
        setattr(combo, key, value)
    if items is not None:
        combo.items.clear()
        for spec in items:
            combo.items.append(ComboItem(item_id=spec["item_id"], quantity=spec["quantity"]))
    db.commit()
    db.refresh(combo)
    return _load(db, combo.id)


def set_active(db: Session, combo_id: int, active: bool) -> Combo | None:
    combo = _load(db, combo_id)
    if not combo:
        return None
    combo.active = active
    db.commit()
    db.refresh(combo)
    return combo


def delete_combo(db: Session, combo_id: int) -> bool:
    combo = _load(db, combo_id)
    if not combo:
        return False
    db.delete(combo)
    db.commit()
    return True


def get_combo_price(db: Session, combo_id: int) -> float | None:
    combo = _load(db, combo_id)
    return combo.combo_price if combo else None
