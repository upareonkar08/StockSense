from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.db.session import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate, PortfolioResponse
from app.schemas.holding import HoldingResponse
from app.schemas.transaction import TransactionResponse
from app.schemas.response import ResponseEnvelope
import app.services.portfolio_service as portfolio_service

router = APIRouter()

@router.get("", response_model=ResponseEnvelope)
async def list_portfolios(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all active portfolios for the current user."""
    portfolios = await portfolio_service.get_portfolios(db, current_user.id)
    return ResponseEnvelope(
        success=True,
        data=[PortfolioResponse.model_validate(p) for p in portfolios],
        message="Portfolios retrieved successfully"
    )

@router.post("", response_model=ResponseEnvelope, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    data: PortfolioCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new investment portfolio."""
    portfolio = await portfolio_service.create_portfolio(db, current_user.id, data)
    return ResponseEnvelope(
        success=True,
        data=PortfolioResponse.model_validate(portfolio),
        message="Portfolio created successfully"
    )

@router.get("/{portfolio_id}", response_model=ResponseEnvelope)
async def get_portfolio_details(
    portfolio_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve details for a specific portfolio."""
    portfolio = await portfolio_service.get_portfolio(db, portfolio_id, current_user.id)
    return ResponseEnvelope(
        success=True,
        data=PortfolioResponse.model_validate(portfolio),
        message="Portfolio details retrieved successfully"
    )

@router.put("/{portfolio_id}", response_model=ResponseEnvelope)
async def update_portfolio_details(
    portfolio_id: UUID,
    data: PortfolioUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a portfolio's metadata or default status."""
    portfolio = await portfolio_service.update_portfolio(db, portfolio_id, current_user.id, data)
    return ResponseEnvelope(
        success=True,
        data=PortfolioResponse.model_validate(portfolio),
        message="Portfolio updated successfully"
    )

@router.delete("/{portfolio_id}", response_model=ResponseEnvelope)
async def delete_portfolio_record(
    portfolio_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete an investment portfolio."""
    await portfolio_service.delete_portfolio(db, portfolio_id, current_user.id)
    return ResponseEnvelope(
        success=True,
        data=None,
        message="Portfolio deleted successfully"
    )

@router.get("/{portfolio_id}/holdings", response_model=ResponseEnvelope)
async def list_portfolio_holdings(
    portfolio_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all current holdings in a portfolio."""
    holdings = await portfolio_service.get_holdings(db, portfolio_id, current_user.id)
    return ResponseEnvelope(
        success=True,
        data=[HoldingResponse.model_validate(h) for h in holdings],
        message="Portfolio holdings retrieved successfully"
    )

@router.get("/{portfolio_id}/transactions", response_model=ResponseEnvelope)
async def list_portfolio_transactions(
    portfolio_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all transactions logged under a portfolio."""
    txs = await portfolio_service.get_transactions(db, portfolio_id, current_user.id)
    return ResponseEnvelope(
        success=True,
        data=[TransactionResponse.model_validate(t) for t in txs],
        message="Portfolio transactions retrieved successfully"
    )

@router.get("/{portfolio_id}/diagnostics", response_model=ResponseEnvelope)
async def get_portfolio_diagnostics_report(
    portfolio_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full diagnostics report (health, Sharpe, HHI, VaR, etc.) for a portfolio."""
    from app.services.market.cache import CachedMarketService
    from app.services.analytics.engine import compute_portfolio_diagnostics
    
    market_service = CachedMarketService()
    report = await compute_portfolio_diagnostics(db, portfolio_id, current_user.id, market_service)
    
    return ResponseEnvelope(
        success=True,
        data=report,
        message="Portfolio diagnostics calculated successfully"
    )

