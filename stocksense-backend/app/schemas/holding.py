from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional
from app.models.enums import AssetType

class HoldingBase(BaseModel):
    ticker: str
    name: Optional[str] = None
    asset_type: AssetType = AssetType.STOCK
    quantity: Decimal
    avg_buy_price: Decimal
    sector: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None

class HoldingCreate(HoldingBase):
    pass

class HoldingUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[AssetType] = None
    quantity: Optional[Decimal] = None
    avg_buy_price: Optional[Decimal] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None

class HoldingResponse(HoldingBase):
    id: UUID
    portfolio_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HoldingDetailResponse(HoldingResponse):
    current_price: Optional[Decimal] = None
    market_value: Optional[Decimal] = None
    cost_basis: Optional[Decimal] = None
    unrealized_gain: Optional[Decimal] = None
    unrealized_gain_percent: Optional[Decimal] = None
    weight: Optional[Decimal] = None
