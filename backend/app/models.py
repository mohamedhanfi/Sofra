"""SQLAlchemy ORM models matching the database schema in Docs/03-backend-spec.md."""

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from .database import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name_en = Column(String, nullable=False)
    name_ar = Column(String, nullable=False)
    description_en = Column(Text)
    description_ar = Column(Text)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    photo_url = Column(String)
    available = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class RestaurantInfo(Base):
    __tablename__ = "restaurant_info"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    address = Column(String)
    phone = Column(String)
    opening_hours = Column(Text)  # JSON string
    delivery_zones = Column(Text)  # JSON string
    payment_note = Column(String, default="Cash on delivery/pickup")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(String, index=True)
    customer_id = Column(String, nullable=False)
    customer_name = Column(String)
    customer_phone = Column(String)
    order_type = Column(
        String,
        nullable=False,
        default="delivery",
    )
    delivery_address = Column(String)
    delivery_fee = Column(Float, default=0)
    subtotal = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="pending")
    cancel_reason = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    item_name_en = Column(String, nullable=False)
    item_name_ar = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    notes = Column(String)

    order = relationship("Order", back_populates="items")


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(String, nullable=False)
    customer_id = Column(String, nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"))
    combo_id = Column(Integer, ForeignKey("combos.id"))
    quantity = Column(Integer, nullable=False)
    notes = Column(String)
    created_at = Column(DateTime, server_default=func.now())


class Combo(Base):
    __tablename__ = "combos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name_en = Column(String, nullable=False)
    name_ar = Column(String, nullable=False)
    combo_price = Column(Float, nullable=False)
    photo_url = Column(String)
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())

    items = relationship("ComboItem", back_populates="combo", cascade="all, delete-orphan")


class ComboItem(Base):
    __tablename__ = "combo_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    combo_id = Column(Integer, ForeignKey("combos.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)

    combo = relationship("Combo", back_populates="items")
    item = relationship("Item")


class Customer(Base):
    __tablename__ = "customers"

    phone = Column(String, primary_key=True)
    name = Column(String)
    last_order_id = Column(Integer, ForeignKey("orders.id"))
    created_at = Column(DateTime, server_default=func.now())


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    stars = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
