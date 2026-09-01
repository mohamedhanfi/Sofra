from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import errors, schemas
from ..database import get_db
from ..deps import require_admin
from ..services import combo_service, menu_service

router = APIRouter()

# ---- Public menu ----
@router.get("/menu", response_model=list[schemas.ItemOut])
def list_menu(
    category: str | None = None,
    available_only: bool = False,
    db: Session = Depends(get_db),
):
    items = menu_service.list_items(db, category=category, available_only=available_only)
    return [schemas.ItemOut.model_validate(it) for it in items]


@router.get("/menu/{item_id}", response_model=schemas.ItemOut)
def get_menu_item(item_id: int, db: Session = Depends(get_db)):
    item = menu_service.get_item(db, item_id)
    if not item:
        raise errors.not_found("item_not_found", "Item not found.")
    return schemas.ItemOut.model_validate(item)


@router.get("/combos")
def list_combos(db: Session = Depends(get_db)):
    return combo_service.list_combos(db, active_only=True)


# ---- Admin menu ----
@router.get("/admin/menu", dependencies=[Depends(require_admin)])
def admin_list_menu(db: Session = Depends(get_db)):
    return [schemas.ItemOut.model_validate(it) for it in menu_service.list_items(db)]


@router.post("/admin/menu", dependencies=[Depends(require_admin)], response_model=schemas.ItemOut)
def admin_create_item(data: schemas.ItemCreate, db: Session = Depends(get_db)):
    item = menu_service.create_item(db, data)
    return schemas.ItemOut.model_validate(item)


@router.put("/admin/menu/{item_id}", dependencies=[Depends(require_admin)], response_model=schemas.ItemOut)
def admin_update_item(item_id: int, data: schemas.ItemUpdate, db: Session = Depends(get_db)):
    item = menu_service.update_item(db, item_id, data)
    if not item:
        raise errors.not_found("item_not_found", "Item not found.")
    return schemas.ItemOut.model_validate(item)


@router.patch("/admin/menu/{item_id}/availability", dependencies=[Depends(require_admin)], response_model=schemas.ItemOut)
def admin_item_availability(item_id: int, data: schemas.AvailabilityUpdate, db: Session = Depends(get_db)):
    item = menu_service.set_availability(db, item_id, data.available)
    if not item:
        raise errors.not_found("item_not_found", "Item not found.")
    return schemas.ItemOut.model_validate(item)


@router.delete("/admin/menu/{item_id}", dependencies=[Depends(require_admin)])
def admin_delete_item(item_id: int, db: Session = Depends(get_db)):
    if not menu_service.delete_item(db, item_id):
        raise errors.not_found("item_not_found", "Item not found.")
    return {"ok": True}


# ---- Admin combos ----
@router.get("/admin/combos", dependencies=[Depends(require_admin)])
def admin_list_combos(db: Session = Depends(get_db)):
    return combo_service.list_combos(db, active_only=False)


@router.post("/admin/combos", dependencies=[Depends(require_admin)])
def admin_create_combo(data: schemas.ComboCreate, db: Session = Depends(get_db)):
    combo = combo_service.create_combo(db, data)
    return combo_service.serialize(combo)


@router.put("/admin/combos/{combo_id}", dependencies=[Depends(require_admin)])
def admin_update_combo(combo_id: int, data: schemas.ComboUpdate, db: Session = Depends(get_db)):
    combo = combo_service.update_combo(db, combo_id, data)
    if not combo:
        raise errors.not_found("combo_not_found", "Combo not found.")
    return combo_service.serialize(combo)


@router.patch("/admin/combos/{combo_id}/active", dependencies=[Depends(require_admin)])
def admin_combo_active(combo_id: int, data: schemas.ActiveUpdate, db: Session = Depends(get_db)):
    combo = combo_service.set_active(db, combo_id, data.active)
    if not combo:
        raise errors.not_found("combo_not_found", "Combo not found.")
    return combo_service.serialize(combo)


@router.delete("/admin/combos/{combo_id}", dependencies=[Depends(require_admin)])
def admin_delete_combo(combo_id: int, db: Session = Depends(get_db)):
    if not combo_service.delete_combo(db, combo_id):
        raise errors.not_found("combo_not_found", "Combo not found.")
    return {"ok": True}
