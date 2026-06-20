from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.session import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.ai import TutorRequest, AnalystRequest, RebalanceRequest
from app.schemas.response import ResponseEnvelope
import app.services.ai.agents as ai_agents
from app.services.market.cache import CachedMarketService
from app.services.analytics.engine import compute_portfolio_diagnostics

router = APIRouter()

@router.post("/tutor", response_model=ResponseEnvelope)
async def ask_tutor(data: TutorRequest):
    """Ask the AI tutor about financial modeling, calculations, or risk metrics."""
    result = ai_agents.ask_ai_tutor(data.query)
    return ResponseEnvelope(
        success=True,
        data=result,
        message="AI Tutor response fetched successfully"
    )

@router.post("/analyst", response_model=ResponseEnvelope)
async def analyze_portfolio(
    data: AnalystRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Analyze a portfolio's overall health and concentration risk, returning insights and feedback."""
    market_service = CachedMarketService()
    # Compute diagnostics
    diagnostics = await compute_portfolio_diagnostics(
        db, data.portfolio_id, current_user.id, market_service
    )
    # Generate analyst commentary
    analysis = ai_agents.analyze_portfolio_quality(diagnostics)
    return ResponseEnvelope(
        success=True,
        data=analysis,
        message="AI Portfolio analysis completed successfully"
    )

@router.post("/rebalance", response_model=ResponseEnvelope)
async def get_rebalance_trades(
    data: RebalanceRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Calculate the exact trades needed to transition a portfolio to target weights."""
    market_service = CachedMarketService()
    rebalance_result = await ai_agents.generate_rebalance_trades(
        db, data.portfolio_id, current_user.id, data.target_weights, market_service
    )
    return ResponseEnvelope(
        success=True,
        data=rebalance_result,
        message="AI Rebalancing trades calculated successfully"
    )
