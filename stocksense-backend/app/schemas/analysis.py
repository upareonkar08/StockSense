from pydantic import BaseModel
from decimal import Decimal
from typing import Optional

class PortfolioDiagnostics(BaseModel):
    total_market_value: Decimal
    total_cost_basis: Decimal
    total_unrealized_gain: Decimal
    total_unrealized_gain_percent: Decimal
    sharpe_ratio: Decimal
    sortino_ratio: Decimal
    volatility: Decimal
    max_drawdown: Decimal
    value_at_risk_95: Decimal
    hhi_diversification: Decimal
    sector_allocations: dict[str, Decimal]
    asset_type_allocations: dict[str, Decimal]
    individual_holding_weights: dict[str, Decimal]
    health_score: int
