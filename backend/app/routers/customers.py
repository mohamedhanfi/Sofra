from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_admin
from ..models import Customer, Order

router = APIRouter()


@router.get("/admin/customers", dependencies=[Depends(require_admin)])
def list_customers(db: Session = Depends(get_db)):
    customers = db.scalars(select(Customer).order_by(Customer.created_at.desc())).all()
    result = []
    for c in customers:
        last_order = None
        if c.last_order_id:
            order = db.get(Order, c.last_order_id)
            if order:
                last_order = {
                    "id": order.id,
                    "status": order.status,
                    "total": order.total,
                    "created_at": order.created_at.isoformat() if order.created_at else None,
                }
        result.append(
            {
                "phone": c.phone,
                "name": c.name,
                "last_order": last_order,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
        )
    return result
