from typing import Optional
from pydantic import BaseModel


class OrderCreate(BaseModel):
    voucher_id: str
    payment_method: str  # pix | credit | debit


class OrderResponse(BaseModel):
    id: str
    user_id: str
    voucher_id: str
    payment_method: str
    status: str
    total_amount: float
    voucher_hours: float
    created_at: str
    paid_at: Optional[str] = None

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    order_id: str
    payment_method: str
    card_number: Optional[str] = None  # Para cartão
    card_cvv: Optional[str] = None
    card_expiry: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    order_id: str
    payment_method: str
    status: str
    amount: float
    pix_qrcode: Optional[str] = None
    card_last_digits: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
