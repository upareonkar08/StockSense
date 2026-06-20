from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class OptimizationRequest(BaseModel):
    portfolio_id: Optional[UUID] = None
    weights: Optional[dict[str, float]] = None
    target: str = "sharpe"  # "sharpe", "volatility", "risk_parity"
    min_weight: float = 0.0
    max_weight: float = 1.0

class OptimizationResult(BaseModel):
    optimized_weights: dict[str, float]
    expected_return: float
    expected_volatility: float
    expected_sharpe: float
    diversification_score: float
