from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class PortfolioBase(BaseModel):
    name: str
    description: Optional[str] = None
    currency: str = "USD"
    is_default: bool = False

class PortfolioCreate(PortfolioBase):
    pass

class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    currency: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None

class PortfolioResponse(PortfolioBase):
    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
