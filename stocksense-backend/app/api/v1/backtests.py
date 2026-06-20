from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from sqlalchemy import select
from typing import List, Optional

from app.db.session import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.models.backtest import Backtest
from app.models.enums import BacktestStatus
from app.schemas.backtest import BacktestCreate, BacktestResponse
from app.schemas.response import ResponseEnvelope
from app.core.exceptions import StockSenseException
from app.services.market.cache import CachedMarketService
from app.services.portfolio_service import get_portfolio, get_holdings
from app.services.backtest.simulator import run_backtest_simulation

router = APIRouter()

@router.post("", response_model=ResponseEnvelope, status_code=status.HTTP_201_CREATED)
async def create_backtest(
    data: BacktestCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Run a new backtest on a portfolio, verifying ownership."""
    # Ensure portfolio ownership
    await get_portfolio(db, data.portfolio_id, current_user.id)
    holdings = await get_holdings(db, data.portfolio_id, current_user.id)
    
    if not holdings:
        raise StockSenseException(
            code="BACKTEST_ERROR",
            message="Cannot backtest an empty portfolio.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
        
    # Construct target weights based on average buy cost basis
    total_val = sum(float(h.quantity * h.avg_buy_price) for h in holdings)
    if total_val <= 0:
        weights = {h.ticker: 1.0 / len(holdings) for h in holdings}
    else:
        weights = {h.ticker: float(h.quantity * h.avg_buy_price) / total_val for h in holdings}
        
    market_service = CachedMarketService()
    backtest = await run_backtest_simulation(
        db=db,
        portfolio_id=data.portfolio_id,
        user_id=current_user.id,
        start_date=data.start_date,
        end_date=data.end_date,
        initial_value=float(data.initial_value),
        market_service=market_service,
        weights=weights,
        name=data.name
    )
    
    if backtest.status == BacktestStatus.FAILED:
        error_msg = "Unknown error"
        if isinstance(backtest.result_json, dict):
            error_msg = backtest.result_json.get("error", "Unknown error")
        raise StockSenseException(
            code="BACKTEST_ERROR",
            message=f"Backtest failed: {error_msg}",
            status_code=status.HTTP_400_BAD_REQUEST
        )
        
    return ResponseEnvelope(
        success=True,
        data=BacktestResponse.model_validate(backtest),
        message="Backtest run completed successfully"
    )

@router.get("/portfolio/{portfolio_id}", response_model=ResponseEnvelope)
async def list_portfolio_backtests(
    portfolio_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List all backtests run for a given portfolio."""
    await get_portfolio(db, portfolio_id, current_user.id)
    
    result = await db.execute(
        select(Backtest)
        .where(Backtest.portfolio_id == portfolio_id)
        .order_by(Backtest.created_at.desc())
    )
    backtests = result.scalars().all()
    return ResponseEnvelope(
        success=True,
        data=[BacktestResponse.model_validate(b) for b in backtests],
        message="Backtests retrieved successfully"
    )

@router.get("/{backtest_id}", response_model=ResponseEnvelope)
async def get_backtest_details(
    backtest_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve details and metrics for a specific backtest."""
    result = await db.execute(
        select(Backtest).where(Backtest.id == backtest_id, Backtest.user_id == current_user.id)
    )
    backtest = result.scalars().first()
    if not backtest:
        raise StockSenseException(
            code="BACKTEST_NOT_FOUND",
            message="Backtest not found or access denied",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return ResponseEnvelope(
        success=True,
        data=BacktestResponse.model_validate(backtest),
        message="Backtest details retrieved successfully"
    )

@router.delete("/{backtest_id}", response_model=ResponseEnvelope)
async def delete_backtest_record(
    backtest_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a specific backtest record."""
    result = await db.execute(
        select(Backtest).where(Backtest.id == backtest_id, Backtest.user_id == current_user.id)
    )
    backtest = result.scalars().first()
    if not backtest:
        raise StockSenseException(
            code="BACKTEST_NOT_FOUND",
            message="Backtest not found or access denied",
            status_code=status.HTTP_404_NOT_FOUND
        )
    await db.delete(backtest)
    await db.commit()
    return ResponseEnvelope(
        success=True,
        data=None,
        message="Backtest deleted successfully"
    )
