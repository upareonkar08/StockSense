from typing import Dict, List, Any
from uuid import UUID
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.analysis import PortfolioDiagnostics
from app.services.portfolio_service import get_holdings, get_portfolio
from app.services.market.cache import CachedMarketService
from app.services.analytics.engine import compute_portfolio_diagnostics

def ask_ai_tutor(query: str) -> Dict[str, Any]:
    """Provide educational answers to investment concepts (Sharpe, HHI, VaR, Beta)."""
    q = query.lower()
    
    if "sharpe" in q:
        explanation = (
            "The Sharpe Ratio measures the risk-adjusted return of an investment. "
            "It is calculated as the portfolio's excess return (return minus risk-free rate) "
            "divided by its standard deviation (volatility). A Sharpe ratio above 1.0 is considered good, "
            "above 2.0 is very good, and above 3.0 is excellent."
        )
        concept = "Sharpe Ratio"
    elif "hhi" in q or "diversification" in q:
        explanation = (
            "The Herfindahl-Hirschman Index (HHI) is a metric used to evaluate portfolio concentration. "
            "It is calculated by squaring the weights of each asset. An HHI below 0.15 indicates a highly "
            "diversified portfolio, whereas an HHI above 0.25 indicates high concentration (higher risk)."
        )
        concept = "HHI & Diversification"
    elif "var" in q or "value at risk" in q:
        explanation = (
            "Value at Risk (VaR) estimates the maximum potential loss of a portfolio over a specific timeframe "
            "with a given confidence level. For example, a 95% daily VaR of 2% means there is a 5% chance "
            "the portfolio will lose more than 2% of its value in a single day."
        )
        concept = "Value at Risk (VaR)"
    elif "beta" in q:
        explanation = (
            "Beta measures a portfolio's sensitivity to market movements (typically benchmarked against the S&P 500 / SPY). "
            "A beta of 1.0 means the portfolio moves in sync with the market. A beta greater than 1.0 indicates "
            "greater volatility (riskier but higher potential return), and a beta less than 1.0 indicates less sensitivity."
        )
        concept = "Beta (Market Sensitivity)"
    elif "risk parity" in q:
        explanation = (
            "Risk Parity is an investment management strategy that focuses on allocating capital based on risk "
            "rather than dollar amounts. In an equal-risk-contribution portfolio, each asset contributes "
            "equally to the overall portfolio volatility, preventing single high-volatility assets from dominating risk."
        )
        concept = "Risk Parity"
    else:
        explanation = (
            "Welcome to StockSense AI Tutor! You can ask me about portfolio metrics, risk management strategies, "
            "or mathematical models like Sharpe Ratio, Sortino Ratio, Value at Risk (VaR), Beta, HHI concentration, "
            "and SLSQP Efficient Frontier optimization."
        )
        concept = "General Investing"
        
    return {
        "concept": concept,
        "explanation": explanation,
        "suggested_questions": [
            "What is a good Sharpe Ratio?",
            "How does HHI measure concentration?",
            "What does a 95% VaR mean?",
            "How do I use Risk Parity?"
        ]
    }

def analyze_portfolio_quality(diagnostics: PortfolioDiagnostics) -> Dict[str, Any]:
    """Generate professional investment analyst commentary based on portfolio diagnostics."""
    health = diagnostics.health_score
    sharpe = float(diagnostics.sharpe_ratio)
    hhi = float(diagnostics.hhi_diversification)
    vol = float(diagnostics.volatility)
    
    insights = []
    recommendations = []
    
    # Analyze Health
    if health >= 80:
        status = "Strong"
        summary = "Your portfolio exhibits strong risk-adjusted parameters and healthy diversification."
    elif health >= 50:
        status = "Moderate"
        summary = "Your portfolio has moderate performance. Optimization is recommended to improve efficiency."
    else:
        status = "Weak"
        summary = "Your portfolio is vulnerable. High concentration or unfavorable risk-adjusted returns are present."

    # Analyze Diversification
    if hhi > 0.25:
        insights.append("High asset concentration detected (HHI exceeds 0.25). A single asset drop could severely impact your value.")
        recommendations.append("Diversify capital across additional low-correlation sectors or assets to lower the HHI.")
    else:
        insights.append("Good asset diversification (HHI is below 0.15), reducing unsystematic concentration risk.")

    # Analyze Sharpe
    if sharpe < 0.5:
        insights.append(f"Low risk-adjusted return (Sharpe: {sharpe:.2f}). You are taking on volatility without sufficient return.")
        recommendations.append("Consider rebalancing into higher-yielding assets or lower-volatility ETFs to optimize Sharpe ratio.")
    elif sharpe > 1.5:
        insights.append(f"Excellent risk-adjusted returns (Sharpe: {sharpe:.2f}). The portfolio is generating strong excess returns per unit of risk.")

    # Analyze Volatility
    if vol > 0.25:
        insights.append(f"High annualized volatility ({vol*100:.1f}%). Expect significant short-term fluctuations.")
        recommendations.append("Incorporate defensive assets like bonds or low-beta equity sectors to smooth out drawdowns.")
        
    if not recommendations:
        recommendations.append("Maintain current strategy. Run periodic walk-forward backtests to monitor risk shifts.")
        
    return {
        "portfolio_status": status,
        "summary_commentary": summary,
        "key_insights": insights,
        "actionable_recommendations": recommendations
    }

async def generate_rebalance_trades(
    db: AsyncSession,
    portfolio_id: UUID,
    user_id: UUID,
    target_weights: Dict[str, float],
    market_service: CachedMarketService
) -> Dict[str, Any]:
    """Calculate the precise buy/sell trades required to transition to target weights."""
    await get_portfolio(db, portfolio_id, user_id)
    holdings = await get_holdings(db, portfolio_id, user_id)
    
    if not holdings:
        return {"trades": [], "total_portfolio_value": 0.0, "message": "Portfolio has no holdings."}

    # Fetch current values
    total_mkt_val = 0.0
    current_values = {}
    current_prices = {}
    
    for h in holdings:
        try:
            price = await market_service.get_price(db, h.ticker)
        except Exception:
            price = float(h.avg_buy_price)
        val = float(h.quantity) * price
        total_mkt_val += val
        current_values[h.ticker] = val
        current_prices[h.ticker] = price

    if total_mkt_val <= 0:
        return {"trades": [], "total_portfolio_value": 0.0, "message": "Portfolio has zero market value."}

    # Ensure target weights sum to 1.0
    total_target_w = sum(target_weights.values())
    if total_target_w == 0:
        return {"trades": [], "total_portfolio_value": total_mkt_val, "message": "Target weights sum to zero."}
    normalized_targets = {k: v / total_target_w for k, v in target_weights.items()}

    trades = []
    
    # All tickers involved (current + target)
    all_tickers = set(current_values.keys()).union(normalized_targets.keys())
    
    for ticker in all_tickers:
        ticker = ticker.upper()
        curr_val = current_values.get(ticker, 0.0)
        target_w = normalized_targets.get(ticker, 0.0)
        target_val = total_mkt_val * target_w
        diff_val = target_val - curr_val
        
        if abs(diff_val) < 1.0: # Skip tiny adjustments under $1
            continue
            
        # Get execution price
        price = current_prices.get(ticker)
        if not price:
            try:
                price = await market_service.get_price(db, ticker)
            except Exception:
                price = 100.0 # fallback default price
                
        qty_diff = diff_val / price
        
        if diff_val < 0:
            trades.append({
                "ticker": ticker,
                "action": "SELL",
                "shares": abs(round(qty_diff, 4)),
                "price": round(price, 2),
                "estimated_value": abs(round(diff_val, 2))
            })
        else:
            trades.append({
                "ticker": ticker,
                "action": "BUY",
                "shares": round(qty_diff, 4),
                "price": round(price, 2),
                "estimated_value": round(diff_val, 2)
            })

    # Sort trades: SELLS first (to free up cash) then BUYS
    trades.sort(key=lambda x: 0 if x["action"] == "SELL" else 1)

    return {
        "total_portfolio_value": round(total_mkt_val, 2),
        "trades": trades,
        "message": "Rebalancing trades calculated. Perform sells first to raise capital for buys."
    }
