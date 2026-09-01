from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Item


def list_items(db: Session, category: str | None = None, available_only: bool = False) -> list[Item]:
    q = select(Item).order_by(Item.category, Item.name_en)
    if category:
        q = q.where(Item.category == category)
    if available_only:
        q = q.where(Item.available.is_(True))
    return list(db.scalars(q).all())


def get_item(db: Session, item_id: int) -> Item | None:
    return db.get(Item, item_id)


def is_available(db: Session, item_id: int) -> bool:
    item = get_item(db, item_id)
    return bool(item and item.available)


def create_item(db: Session, data) -> Item:
    item = Item(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_item(db: Session, item_id: int, data) -> Item | None:
    item = get_item(db, item_id)
    if not item:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


def set_availability(db: Session, item_id: int, available: bool) -> Item | None:
    item = get_item(db, item_id)
    if not item:
        return None
    item.available = available
    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item_id: int) -> bool:
    item = get_item(db, item_id)
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True
