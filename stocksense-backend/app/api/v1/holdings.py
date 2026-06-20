from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from sqlalchemy import select

from app.db.session import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.models.holding import Holding
from app.models.portfolio import Portfolio
from app.schemas.holding import HoldingResponse
from app.schemas.response import ResponseEnvelope
from app.core.exceptions import StockSenseException

router = APIRouter()

@router.get("/{holding_id}", response_model=ResponseEnvelope)
async def get_holding(
    holding_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve details for a specific holding, verifying user ownership."""
    result = await db.execute(
        select(Holding)
        .join(Portfolio, Holding.portfolio_id == Portfolio.id)
        .where(Holding.id == holding_id, Portfolio.user_id == current_user.id)
    )
    holding = result.scalars().first()
    if not holding:
        raise StockSenseException(
            code="HOLDING_NOT_FOUND",
            message="Holding not found or access denied",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return ResponseEnvelope(
        success=True,
        data=HoldingResponse.model_validate(holding),
        message="Holding details retrieved successfully"
    )
