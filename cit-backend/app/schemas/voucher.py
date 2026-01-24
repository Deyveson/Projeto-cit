from typing import Optional
from pydantic import BaseModel


class VoucherCreate(BaseModel):
    name: str
    hours: float
    price: float
    active: bool = True
    description: Optional[str] = None


class VoucherUpdate(BaseModel):
    name: Optional[str] = None
    hours: Optional[float] = None
    price: Optional[float] = None
    active: Optional[bool] = None
    description: Optional[str] = None


class VoucherResponse(BaseModel):
    id: str
    name: str
    hours: float
    price: float
    active: bool
    description: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
