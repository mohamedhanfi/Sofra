import json

from sqlalchemy.orm import Session

from ..models import RestaurantInfo

DEFAULT_DELIVERY_FEE = 20.0


def _parse(value):
    if not value:
        return None
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return None


def serialize(info: RestaurantInfo) -> dict:
    return {
        "id": info.id,
        "name": info.name,
        "address": info.address,
        "phone": info.phone,
        "opening_hours": _parse(info.opening_hours),
        "delivery_zones": _parse(info.delivery_zones),
        "payment_note": info.payment_note,
    }


def get_info(db: Session) -> RestaurantInfo | None:
    return db.get(RestaurantInfo, 1)


def get_info_dict(db: Session) -> dict | None:
    info = get_info(db)
    return serialize(info) if info else None


def update_info(db: Session, data) -> RestaurantInfo:
    info = get_info(db)
    if not info:
        info = RestaurantInfo(id=1)
        db.add(info)
    values = data.model_dump(exclude_unset=True)
    for key, value in values.items():
        if key in ("opening_hours", "delivery_zones") and value is not None:
            value = json.dumps(value, ensure_ascii=False)
        setattr(info, key, value)
    db.commit()
    db.refresh(info)
    return info


def delivery_fee(db: Session) -> float:
    """Return the base delivery fee (single zone default)."""
    zones = None
    info = get_info(db)
    if info:
        zones = _parse(info.delivery_zones)
    if zones:
        for zone in zones:
            fee = zone.get("fee") if isinstance(zone, dict) else None
            if fee:
                return float(fee)
    return DEFAULT_DELIVERY_FEE
