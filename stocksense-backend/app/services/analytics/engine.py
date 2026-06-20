from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from decimal import Decimal
import pandas as pd

from app.schemas.analysis import PortfolioDiagnostics
from app.services.portfolio_service import get_portfolio, get_holdings
from app.services.market.cache import CachedMarketService
from app.services.analytics.risk import calculate_portfolio_returns, calculate_risk_metrics
from app.services.analytics.diversification import calculate_allocations
from app.services.analytics.health_score import calculate_composite_health_score

async def compute_portfolio_diagnostics(
    db: AsyncSession,
    portfolio_id: UUID,
    user_id: UUID,
    market_service: CachedMarketService
) -> PortfolioDiagnostics:
    """Orchestrate the calculations for the portfolio diagnostics analysis dashboard."""
    # 1. Fetch portfolio and holdings
    await get_portfolio(db, portfolio_id, user_id)
    holdings = await get_holdings(db, portfolio_id, user_id)
    
    if not holdings:
        return PortfolioDiagnostics(
            total_market_value=Decimal("0.0"),
            total_cost_basis=Decimal("0.0"),
            total_unrealized_gain=Decimal("0.0"),
            total_unrealized_gain_percent=Decimal("0.0"),
            sharpe_ratio=Decimal("0.0"),
            sortino_ratio=Decimal("0.0"),
            volatility=Decimal("0.0"),
            max_drawdown=Decimal("0.0"),
            value_at_risk_95=Decimal("0.0"),
            hhi_diversification=Decimal("1.0"),
            sector_allocations={},
            asset_type_allocations={},
            individual_holding_weights={},
            health_score=0
        )
        
    # 2. Fetch current prices & construct holdings info
    holdings_data = []
    price_history = {}
    weights = {}
    total_market_value = Decimal("0.0")
    total_cost_basis = Decimal("0.0")
    
    for holding in holdings:
        try:
            current_price = await market_service.get_price(db, holding.ticker)
        except Exception:
            current_price = float(holding.avg_buy_price)
            
        mkt_val = float(holding.quantity) * current_price
        cost_basis = float(holding.quantity * holding.avg_buy_price)
        
        total_market_value += Decimal(str(mkt_val))
        total_cost_basis += Decimal(str(cost_basis))
        
        try:
            info = await market_service.get_info(db, holding.ticker)
            sector = info.get("sector") or holding.sector
            asset_type = info.get("asset_type") or holding.asset_type
        except Exception:
            sector = holding.sector
            asset_type = holding.asset_type
            
        holdings_data.append({
            "ticker": holding.ticker,
            "asset_type": asset_type,
            "sector": sector,
            "market_value": mkt_val,
            "cost_basis": cost_basis
        })
        
        # Try fetching history for 1 year
        try:
            df_hist = await market_service.get_history(db, holding.ticker, period="1y")
            if not df_hist.empty and "Close" in df_hist.columns:
                price_history[holding.ticker] = df_hist["Close"]
        except Exception:
            pass

    if total_market_value > 0:
        for h in holdings_data:
            weights[h["ticker"]] = h["market_value"] / float(total_market_value)
    else:
        for h in holdings_data:
            weights[h["ticker"]] = 1.0 / len(holdings_data)

    # 3. Diversification Calculations
    allocs = calculate_allocations(holdings_data)
    hhi = allocs["hhi"]
    
    sector_allocs_dec = {k: Decimal(str(round(v, 6))) for k, v in allocs["sector_allocations"].items()}
    asset_allocs_dec = {k: Decimal(str(round(v, 6))) for k, v in allocs["asset_type_allocations"].items()}
    weights_dec = {k: Decimal(str(round(v, 6))) for k, v in allocs["ticker_weights"].items()}
    
    # 4. Risk Metrics Calculations
    portfolio_returns = calculate_portfolio_returns(price_history, weights)
    
    benchmark_returns = None
    try:
        df_spy = await market_service.get_history(db, "SPY", period="1y")
        if not df_spy.empty and "Close" in df_spy.columns:
            benchmark_returns = df_spy["Close"].pct_change().dropna()
    except Exception:
        pass
        
    risk = calculate_risk_metrics(portfolio_returns, benchmark_returns)
    
    # 5. Composite Health Score
    sector_count = len([s for s in allocs["sector_allocations"].keys() if s not in ["Unclassified", "Unknown"]])
    health = calculate_composite_health_score(
        hhi=hhi,
        sharpe_ratio=risk["sharpe_ratio"],
        max_drawdown=risk["max_drawdown"],
        sector_count=sector_count
    )
    
    unrealized_gain = total_market_value - total_cost_basis
    unrealized_gain_percent = Decimal("0.0")
    if total_cost_basis > 0:
        unrealized_gain_percent = unrealized_gain / total_cost_basis
        
    return PortfolioDiagnostics(
        total_market_value=total_market_value,
        total_cost_basis=total_cost_basis,
        total_unrealized_gain=unrealized_gain,
        total_unrealized_gain_percent=unrealized_gain_percent,
        sharpe_ratio=Decimal(str(round(risk["sharpe_ratio"], 6))),
        sortino_ratio=Decimal(str(round(risk["sortino_ratio"], 6))),
        volatility=Decimal(str(round(risk["volatility"], 6))),
        max_drawdown=Decimal(str(round(risk["max_drawdown"], 6))),
        value_at_risk_95=Decimal(str(round(risk["value_at_risk_95"], 6))),
        hhi_diversification=Decimal(str(round(hhi, 6))),
        sector_allocations=sector_allocs_dec,
        asset_type_allocations=asset_allocs_dec,
        individual_holding_weights=weights_dec,
        health_score=health
    )
