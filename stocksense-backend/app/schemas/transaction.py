from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional
from app.models.enums import TransactionType

class TransactionBase(BaseModel):
    ticker: str
    type: TransactionType
    quantity: Decimal
    price: Decimal
    fee: Decimal = Decimal("0.00")
    notes: Optional[str] = None
    executed_at: datetime

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: UUID
    portfolio_id: UUID
    holding_id: Optional[UUID] = None
    total_amount: Decimal
    created_at: datetime

    class Config:
        from_attributes = True
