"""Pydantic schemas for request/response bodies.

Error convention (from Docs/03-backend-spec.md Section 8):
    {"error": {"code": "...", "message": "..."}}
"""

from typing import List, Optional

from pydantic import BaseModel, Field


class ErrorBody(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorBody


# --- Menu ---
class ItemOut(BaseModel):
    id: int
    name_en: str
    name_ar: str
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    price: float
    category: str
    photo_url: Optional[str] = None
    available: bool

    class Config:
        from_attributes = True


class ItemCreate(BaseModel):
    name_en: str
    name_ar: str
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    price: float = Field(ge=0)
    category: str
    photo_url: Optional[str] = None
    available: bool = True


class ItemUpdate(BaseModel):
    name_en: Optional[str] = None
    name_ar: Optional[str] = None
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    category: Optional[str] = None
    photo_url: Optional[str] = None
    available: Optional[bool] = None


class AvailabilityUpdate(BaseModel):
    available: bool


# --- Combos ---
class ComboItemSpec(BaseModel):
    item_id: int
    quantity: int = Field(ge=1)


class ComboCreate(BaseModel):
    name_en: str
    name_ar: str
    combo_price: float = Field(ge=0)
    photo_url: Optional[str] = None
    active: bool = True
    items: List[ComboItemSpec]


class ComboUpdate(BaseModel):
    name_en: Optional[str] = None
    name_ar: Optional[str] = None
    combo_price: Optional[float] = Field(default=None, ge=0)
    photo_url: Optional[str] = None
    active: Optional[bool] = None
    items: Optional[List[ComboItemSpec]] = None


class ActiveUpdate(BaseModel):
    active: bool


class ComboOut(BaseModel):
    id: int
    name_en: str
    name_ar: str
    combo_price: float
    photo_url: Optional[str] = None
    active: bool
    component_sum: float
    available: bool
    items: List[dict]

    class Config:
        from_attributes = True


# --- Cart ---
class CartAddRequestBody(BaseModel):
    item_id: Optional[int] = None
    combo_id: Optional[int] = None
    quantity: int = Field(ge=1)
    notes: Optional[str] = None


class CartQuantityUpdate(BaseModel):
    quantity: int = Field(ge=0)


class CartLineOut(BaseModel):
    key: str
    type: str
    id: int
    title_en: str
    title_ar: str
    unit_price: float
    quantity: int
    photo_url: Optional[str] = None


class CartTotalOut(BaseModel):
    subtotal: float
    delivery_fee: float
    total: float
    currency: str = "EGP"


# --- Orders ---
class OrderCreate(BaseModel):
    conversation_id: str
    customer_id: str
    order_type: str = "delivery"
    delivery_address: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None


class OrderOut(BaseModel):
    id: int
    order_type: str
    status: str
    subtotal: float
    delivery_fee: float
    total: float
    created_at: Optional[str] = None
    items: List[dict]
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    delivery_address: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str


class CancelRequest(BaseModel):
    reason: str


class RatingCreate(BaseModel):
    stars: int = Field(ge=1, le=5)
    comment: Optional[str] = None


# --- Restaurant ---
class RestaurantInfoUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    opening_hours: Optional[dict] = None
    delivery_zones: Optional[List[dict]] = None
    payment_note: Optional[str] = None


# --- Auth ---
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str


# --- Chat ---
class ChatRequest(BaseModel):
    conversation_id: str
    customer_id: str
    message: str
