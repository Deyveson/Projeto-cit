from typing import Optional, Dict, Any
from pydantic import BaseModel


class OrderCreate(BaseModel):
    voucher_id: str
    payment_method: str  # pix | credit | debit
    company_slug: Optional[str] = None  # Slug da empresa para associar o pedido


class CompanyInfo(BaseModel):
    name: Optional[str] = None
    cnpj: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class OrderResponse(BaseModel):
    id: str
    user_id: str
    voucher_id: str
    payment_method: str
    status: str
    total_amount: float
    voucher_hours: float
    voucher_name: Optional[str] = None
    company: Optional[CompanyInfo] = None
    created_at: str
    paid_at: Optional[str] = None

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    order_id: str
    payment_method: str
    card_number: Optional[str] = None  # Para cartão (simulação)
    card_cvv: Optional[str] = None
    card_expiry: Optional[str] = None
    card_token: Optional[str] = None  # Token do Mercado Pago SDK
    card_payment_method_id: Optional[str] = None  # visa, master, etc
    card_installments: Optional[int] = 1  # Número de parcelas
    payer_email: Optional[str] = None  # Email do pagador
    card_holder_name: Optional[str] = None  # Nome no cartão
    identification_type: Optional[str] = None  # CPF, CNPJ
    identification_number: Optional[str] = None  # Número do documento


class PaymentResponse(BaseModel):
    id: str
    order_id: str
    payment_method: str
    status: str
    amount: float
    pix_qrcode: Optional[str] = None
    pix_key: Optional[str] = None
    card_last_digits: Optional[str] = None
    mercadopago_payment_id: Optional[str] = None
    status_detail: Optional[str] = None
    installments: Optional[int] = None
    created_at: str

    class Config:
        from_attributes = True
