from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..deps import require_admin
from ..services import restaurant_service

router = APIRouter()


@router.get("/restaurant")
def get_restaurant(db: Session = Depends(get_db)):
    info = restaurant_service.get_info_dict(db)
    if not info:
        # Return a friendly default rather than 404 until the owner updates info.
        return {
            "name": "Sofra",
            "address": None,
            "phone": None,
            "opening_hours": None,
            "delivery_zones": None,
            "payment_note": None,
        }
    return info


@router.put("/admin/restaurant", dependencies=[Depends(require_admin)])
def update_restaurant(data: schemas.RestaurantInfoUpdate, db: Session = Depends(get_db)):
    info = restaurant_service.update_info(db, data)
    return restaurant_service.serialize(info)
