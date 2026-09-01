from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..models import Customer, Order


def get_customer(db: Session, phone: str) -> Customer | None:
    return db.get(Customer, phone)


def upsert_customer(db: Session, phone: str, name: str | None, order_id: int) -> Customer:
    customer = get_customer(db, phone)
    if customer:
        customer.name = name or customer.name
        customer.last_order_id = order_id
    else:
        customer = Customer(phone=phone, name=name, last_order_id=order_id)
        db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def get_last_order(db: Session, phone: str) -> Order | None:
    customer = get_customer(db, phone)
    if not customer or not customer.last_order_id:
        return None
    return db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == customer.last_order_id)
    )
