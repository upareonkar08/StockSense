from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.portfolios import router as portfolios_router
from app.api.v1.holdings import router as holdings_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.optimization import router as optimization_router
from app.api.v1.backtests import router as backtests_router
from app.api.v1.ai import router as ai_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
router.include_router(users_router, prefix="/users", tags=["Users"])
router.include_router(portfolios_router, prefix="/portfolios", tags=["Portfolios"])
router.include_router(holdings_router, prefix="/holdings", tags=["Holdings"])
router.include_router(transactions_router, prefix="/transactions", tags=["Transactions"])
router.include_router(optimization_router, prefix="/optimization", tags=["Optimization"])
router.include_router(backtests_router, prefix="/backtests", tags=["Backtests"])
router.include_router(ai_router, prefix="/ai", tags=["AI Agents"])
