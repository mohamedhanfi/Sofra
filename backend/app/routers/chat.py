from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas
from ..agent.agent import RestaurantAgent
from ..database import get_db

router = APIRouter()
_agent = RestaurantAgent()


@router.post("/chat")
def chat(payload: schemas.ChatRequest, db: Session = Depends(get_db)):
    result = _agent.process_message(
        db,
        payload.conversation_id,
        payload.customer_id,
        payload.message,
    )
    result["conversation_id"] = payload.conversation_id
    return result
