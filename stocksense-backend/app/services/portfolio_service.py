import uuid
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from fastapi import status

from app.models.portfolio import Portfolio
from app.models.holding import Holding
from app.models.transaction import Transaction
from app.models.enums import TransactionType, AssetType
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate
from app.schemas.transaction import TransactionCreate
from app.core.exceptions import StockSenseException

# Portfolios CRUD
async def get_portfolios(db: AsyncSession, user_id: uuid.UUID) -> List[Portfolio]:
    result = await db.execute(
        select(Portfolio).where(Portfolio.user_id == user_id, Portfolio.is_active == True)
    )
    return list(result.scalars().all())

async def get_portfolio(db: AsyncSession, portfolio_id: uuid.UUID, user_id: uuid.UUID) -> Portfolio:
    result = await db.execute(
        select(Portfolio).where(
            Portfolio.id == portfolio_id, 
            Portfolio.user_id == user_id, 
            Portfolio.is_active == True
        )
    )
    portfolio = result.scalars().first()
    if not portfolio:
        raise StockSenseException(
            code="PORTFOLIO_NOT_FOUND",
            message="Portfolio not found or access denied",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return portfolio

async def create_portfolio(db: AsyncSession, user_id: uuid.UUID, data: PortfolioCreate) -> Portfolio:
    # If is_default is true, unset default status of other portfolios
    if data.is_default:
        await db.execute(
            update(Portfolio)
            .where(Portfolio.user_id == user_id)
            .values(is_default=False)
        )
    
    # Check if this is the user's first portfolio. If so, make it default.
    existing = await db.execute(
        select(Portfolio).where(Portfolio.user_id == user_id, Portfolio.is_active == True)
    )
    is_first = existing.scalars().first() is None
    
    new_portfolio = Portfolio(
        user_id=user_id,
        name=data.name,
        description=data.description,
        currency=data.currency,
        is_default=data.is_default or is_first
    )
    db.add(new_portfolio)
    await db.commit()
    await db.refresh(new_portfolio)
    return new_portfolio

async def update_portfolio(
    db: AsyncSession, portfolio_id: uuid.UUID, user_id: uuid.UUID, data: PortfolioUpdate
) -> Portfolio:
    portfolio = await get_portfolio(db, portfolio_id, user_id)
    
    if data.is_default:
        await db.execute(
            update(Portfolio)
            .where(Portfolio.user_id == user_id)
            .values(is_default=False)
        )
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(portfolio, field, value)
        
    await db.commit()
    await db.refresh(portfolio)
    return portfolio

async def delete_portfolio(db: AsyncSession, portfolio_id: uuid.UUID, user_id: uuid.UUID) -> None:
    portfolio = await get_portfolio(db, portfolio_id, user_id)
    
    # Soft delete
    portfolio.is_active = False
    await db.commit()

# Holdings CRUD
async def get_holdings(db: AsyncSession, portfolio_id: uuid.UUID, user_id: uuid.UUID) -> List[Holding]:
    # Ensure portfolio ownership
    await get_portfolio(db, portfolio_id, user_id)
    
    result = await db.execute(
        select(Holding).where(Holding.portfolio_id == portfolio_id)
    )
    return list(result.scalars().all())

# Transactions CRUD
async def get_transactions(db: AsyncSession, portfolio_id: uuid.UUID, user_id: uuid.UUID) -> List[Transaction]:
    # Ensure portfolio ownership
    await get_portfolio(db, portfolio_id, user_id)
    
    result = await db.execute(
        select(Transaction)
        .where(Transaction.portfolio_id == portfolio_id)
        .order_by(Transaction.executed_at.desc())
    )
    return list(result.scalars().all())

async def add_transaction(
    db: AsyncSession, portfolio_id: uuid.UUID, user_id: uuid.UUID, data: TransactionCreate
) -> Transaction:
    portfolio = await get_portfolio(db, portfolio_id, user_id)
    
    ticker = data.ticker.upper().strip()
    qty = data.quantity
    price = data.price
    fee = data.fee
    
    if qty <= 0:
        raise StockSenseException(
            code="INVALID_TRANSACTION",
            message="Quantity must be greater than zero",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    if price < 0:
        raise StockSenseException(
            code="INVALID_TRANSACTION",
            message="Price cannot be negative",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    if fee < 0:
        raise StockSenseException(
            code="INVALID_TRANSACTION",
            message="Fee cannot be negative",
            status_code=status.HTTP_400_BAD_REQUEST
        )
        
    # Get or create holding
    holding_result = await db.execute(
        select(Holding).where(Holding.portfolio_id == portfolio_id, Holding.ticker == ticker)
    )
    holding = holding_result.scalars().first()
    
    total_amount = qty * price
    # Standard transaction type processing
    if data.type == TransactionType.BUY:
        # Include fees in total amount and cost basis
        total_amount = (qty * price) + fee
        if holding:
            new_qty = holding.quantity + qty
            new_avg_price = ((holding.quantity * holding.avg_buy_price) + total_amount) / new_qty
            holding.quantity = new_qty
            holding.avg_buy_price = new_avg_price
        else:
            avg_price = total_amount / qty
            holding = Holding(
                portfolio_id=portfolio_id,
                ticker=ticker,
                asset_type=AssetType.STOCK,
                quantity=qty,
                avg_buy_price=avg_price
            )
            db.add(holding)
            await db.flush() # get holding.id
            
    elif data.type == TransactionType.SELL:
        # Subtract fees from cash generated, but for cost basis / holding calculations:
        total_amount = (qty * price) - fee
        if not holding or holding.quantity < qty:
            raise StockSenseException(
                code="INVALID_TRANSACTION",
                message=f"Insufficient holdings for ticker {ticker} to complete sell.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        new_qty = holding.quantity - qty
        if new_qty == 0:
            # Delete holding since qty is now 0
            await db.delete(holding)
            holding = None
        else:
            holding.quantity = new_qty
            
    elif data.type == TransactionType.SPLIT:
        # For splits, qty represents the split ratio (e.g. 2 for 2-for-1 split)
        # Price is not strictly utilized but logged
        if not holding:
            raise StockSenseException(
                code="INVALID_TRANSACTION",
                message=f"No holding exists for {ticker} to perform a split.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        ratio = qty
        holding.quantity = holding.quantity * ratio
        holding.avg_buy_price = holding.avg_buy_price / ratio
        
    elif data.type == TransactionType.DIVIDEND:
        # Dividend logs cash received, does not alter holding qty or avg price
        pass

    new_tx = Transaction(
        portfolio_id=portfolio_id,
        holding_id=holding.id if holding else None,
        ticker=ticker,
        type=data.type,
        quantity=qty,
        price=price,
        total_amount=total_amount,
        fee=fee,
        notes=data.notes,
        executed_at=data.executed_at
    )
    db.add(new_tx)
    await db.commit()
    
    if holding:
        await db.refresh(holding)
    await db.refresh(new_tx)
    return new_tx

async def delete_transaction(
    db: AsyncSession, portfolio_id: uuid.UUID, user_id: uuid.UUID, transaction_id: uuid.UUID
) -> None:
    # Ensure portfolio ownership
    await get_portfolio(db, portfolio_id, user_id)
    
    tx_result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id, Transaction.portfolio_id == portfolio_id)
    )
    tx = tx_result.scalars().first()
    if not tx:
        raise StockSenseException(
            code="TRANSACTION_NOT_FOUND",
            message="Transaction not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
        
    # Revert transaction effects on holdings if possible
    holding_result = await db.execute(
        select(Holding).where(Holding.portfolio_id == portfolio_id, Holding.ticker == tx.ticker)
    )
    holding = holding_result.scalars().first()
    
    if tx.type == TransactionType.BUY:
        if holding:
            # If removing a BUY, we reduce holding quantity
            if holding.quantity < tx.quantity:
                raise StockSenseException(
                    code="INVALID_TRANSACTION",
                    message="Cannot delete transaction: would result in negative holding quantity.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            new_qty = holding.quantity - tx.quantity
            if new_qty == 0:
                await db.delete(holding)
            else:
                # Recalculate average buy price if possible (otherwise keep same)
                if new_qty > 0:
                    old_cost = holding.quantity * holding.avg_buy_price
                    new_cost = old_cost - tx.total_amount
                    holding.avg_buy_price = new_cost / new_qty
                holding.quantity = new_qty
    elif tx.type == TransactionType.SELL:
        if holding:
            holding.quantity = holding.quantity + tx.quantity
        else:
            # Recreate holding
            holding = Holding(
                portfolio_id=portfolio_id,
                ticker=tx.ticker,
                asset_type=AssetType.STOCK,
                quantity=tx.quantity,
                avg_buy_price=tx.price # fallback to sell price as base
            )
            db.add(holding)
    elif tx.type == TransactionType.SPLIT:
        if holding:
            # Revert split ratio
            ratio = tx.quantity
            holding.quantity = holding.quantity / ratio
            holding.avg_buy_price = holding.avg_buy_price * ratio
            
    await db.delete(tx)
    await db.commit()
