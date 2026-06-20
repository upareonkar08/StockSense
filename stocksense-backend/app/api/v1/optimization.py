from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.db.session import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.optimization import OptimizationRequest, OptimizationResult
from app.schemas.response import ResponseEnvelope
from app.core.exceptions import StockSenseException
from app.services.market.cache import CachedMarketService
from app.services.portfolio_service import get_holdings, get_portfolio
from app.services.optimization.efficient_frontier import optimize_mean_variance
from app.services.optimization.risk_parity import optimize_risk_parity
from app.services.analytics.diversification import calculate_hhi

router = APIRouter()

@router.post("", response_model=ResponseEnvelope)
async def optimize_portfolio_allocations(
    data: OptimizationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Run SLSQP optimization on a portfolio or custom weights."""
    market_service = CachedMarketService()
    price_history = {}
    
    # Resolve assets to optimize
    if data.portfolio_id:
        # Ensure portfolio exists and belongs to user
        await get_portfolio(db, data.portfolio_id, current_user.id)
        holdings = await get_holdings(db, data.portfolio_id, current_user.id)
        if not holdings:
            raise StockSenseException(
                code="OPTIMIZATION_ERROR",
                message="Cannot optimize an empty portfolio.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        tickers = [h.ticker for h in holdings]
    elif data.weights:
        tickers = list(data.weights.keys())
    else:
        raise StockSenseException(
            code="OPTIMIZATION_ERROR",
            message="Either portfolio_id or weights must be provided.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
        
    # Fetch price history for tickers
    for ticker in tickers:
        try:
            df = await market_service.get_history(db, ticker, period="1y")
            if not df.empty and "Close" in df.columns:
                price_history[ticker] = df["Close"]
        except Exception:
            pass
            
    if not price_history:
        raise StockSenseException(
            code="OPTIMIZATION_ERROR",
            message="Could not fetch historical price data for the assets.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
        
    # Run appropriate optimization target
    if data.target in ["sharpe", "volatility"]:
        opt_weights, ret, vol, sharpe = optimize_mean_variance(
            price_history,
            target=data.target,
            min_weight=data.min_weight,
            max_weight=data.max_weight
        )
    elif data.target == "risk_parity":
        opt_weights, ret, vol, sharpe = optimize_risk_parity(
            price_history,
            min_weight=data.min_weight,
            max_weight=data.max_weight
        )
    else:
        raise StockSenseException(
            code="OPTIMIZATION_ERROR",
            message=f"Invalid optimization target: {data.target}",
            status_code=status.HTTP_400_BAD_REQUEST
        )
        
    hhi = calculate_hhi(opt_weights)
    diversification_score = 1.0 - hhi
    
    result = OptimizationResult(
        optimized_weights=opt_weights,
        expected_return=ret,
        expected_volatility=vol,
        expected_sharpe=sharpe,
        diversification_score=diversification_score
    )
    
    return ResponseEnvelope(
        success=True,
        data=result,
        message="Portfolio optimization completed successfully"
    )
