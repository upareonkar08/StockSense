from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, Any
from app.models.enums import BacktestStatus

class BacktestBase(BaseModel):
    portfolio_id: UUID
    name: Optional[str] = None
    start_date: date
    end_date: date
    initial_value: Decimal

class BacktestCreate(BacktestBase):
    pass

class BacktestResponse(BacktestBase):
    id: UUID
    user_id: UUID
    final_value: Optional[Decimal] = None
    cagr: Optional[Decimal] = None
    sharpe_ratio: Optional[Decimal] = None
    sortino_ratio: Optional[Decimal] = None
    max_drawdown: Optional[Decimal] = None
    volatility: Optional[Decimal] = None
    calmar_ratio: Optional[Decimal] = None
    benchmark_return: Optional[Decimal] = None
    result_json: Optional[Any] = None
    status: BacktestStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
