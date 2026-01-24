from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from app.models.user import PyObjectId


class Payment(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    order_id: str
    payment_method: str  # pix | credit | debit
    status: str = "pending"  # pending | confirmed | failed
    amount: float
    
    # Dados específicos do pagamento
    pix_qrcode: Optional[str] = None  # Para PIX
    card_last_digits: Optional[str] = None  # Para cartão
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
