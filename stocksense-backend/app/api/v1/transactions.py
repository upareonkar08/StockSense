from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from sqlalchemy import select

from app.db.session import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.schemas.response import ResponseEnvelope
from app.core.exceptions import StockSenseException
import app.services.portfolio_service as portfolio_service

router = APIRouter()

@router.post("/portfolio/{portfolio_id}", response_model=ResponseEnvelope, status_code=status.HTTP_201_CREATED)
async def log_transaction(
    portfolio_id: UUID,
    data: TransactionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Log a new transaction (BUY/SELL/SPLIT/DIVIDEND) for a portfolio."""
    tx = await portfolio_service.add_transaction(db, portfolio_id, current_user.id, data)
    return ResponseEnvelope(
        success=True,
        data=TransactionResponse.model_validate(tx),
        message="Transaction logged successfully"
    )

@router.delete("/{transaction_id}", response_model=ResponseEnvelope)
async def delete_transaction_record(
    transaction_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a transaction and revert its effects on portfolio holdings."""
    tx_result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    tx = tx_result.scalars().first()
    if not tx:
        raise StockSenseException(
            code="TRANSACTION_NOT_FOUND",
            message="Transaction not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
        
    await portfolio_service.delete_transaction(db, tx.portfolio_id, current_user.id, transaction_id)
    return ResponseEnvelope(
        success=True,
        data=None,
        message="Transaction deleted and reverted successfully"
    )
