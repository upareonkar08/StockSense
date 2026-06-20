from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional, Any
from app.models.enums import RecommendationType

class RecommendationBase(BaseModel):
    portfolio_id: UUID
    type: RecommendationType
    title: str
    summary: Optional[str] = None
    current_weights: Optional[dict[str, float]] = None
    suggested_weights: Optional[dict[str, float]] = None
    expected_sharpe_improvement: Optional[Decimal] = None
    expected_return_improvement: Optional[Decimal] = None
    confidence_score: Optional[Decimal] = None
    is_applied: bool = False
    expires_at: Optional[datetime] = None

class RecommendationCreate(RecommendationBase):
    pass

class RecommendationResponse(RecommendationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
