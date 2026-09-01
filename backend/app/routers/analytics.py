from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_admin
from ..services import analytics_service, order_service

router = APIRouter()


@router.get("/admin/analytics", dependencies=[Depends(require_admin)])
def get_analytics(period: str = "7d", db: Session = Depends(get_db)):
    return analytics_service.get_summary(db, period)
