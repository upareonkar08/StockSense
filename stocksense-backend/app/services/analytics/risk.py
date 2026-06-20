import numpy as np
import pandas as pd
from typing import Dict, Optional, Tuple

def calculate_portfolio_returns(
    price_history: Dict[str, pd.Series], weights: Dict[str, float]
) -> pd.Series:
    """Combine historical price series of tickers into weighted daily returns.
    
    price_history: dict mapping ticker -> close price pd.Series
    weights: dict mapping ticker -> target weight (sum = 1.0)
    """
    if not price_history or not weights:
        return pd.Series(dtype=float)

    # Convert prices to daily returns
    returns_dict = {}
    for ticker, series in price_history.items():
        if not series.empty:
            returns_dict[ticker] = series.pct_change().dropna()

    if not returns_dict:
        return pd.Series(dtype=float)

    # Align dates using a DataFrame
    df_returns = pd.DataFrame(returns_dict)
    df_returns = df_returns.ffill().bfill() # Handle missing alignment

    # Calculate weighted portfolio returns
    weighted_returns = pd.Series(0.0, index=df_returns.index)
    for ticker, weight in weights.items():
        if ticker in df_returns.columns:
            weighted_returns += df_returns[ticker] * weight

    return weighted_returns

def calculate_risk_metrics(
    portfolio_returns: pd.Series, 
    benchmark_returns: Optional[pd.Series] = None, 
    rf_rate: float = 0.02
) -> Dict[str, float]:
    """Calculate Sharpe, Sortino, Max Drawdown, VaR 95%, and Beta from daily returns."""
    metrics = {
        "sharpe_ratio": 0.0,
        "sortino_ratio": 0.0,
        "volatility": 0.0,
        "max_drawdown": 0.0,
        "value_at_risk_95": 0.0,
        "beta": 1.0
    }

    if portfolio_returns.empty or len(portfolio_returns) < 5:
        return metrics

    # Daily to Annualized factors
    trading_days = 252

    # Volatility (Annualized)
    daily_vol = portfolio_returns.std()
    ann_vol = daily_vol * np.sqrt(trading_days)
    metrics["volatility"] = float(ann_vol)

    # Annualized Return
    mean_daily_return = portfolio_returns.mean()
    ann_return = mean_daily_return * trading_days

    # Sharpe Ratio
    if ann_vol > 0:
        metrics["sharpe_ratio"] = float((ann_return - rf_rate) / ann_vol)

    # Sortino Ratio (Downside deviation)
    # Downside deviation takes returns below risk-free rate / trading_days or simply below 0
    downside_returns = portfolio_returns[portfolio_returns < 0]
    if not downside_returns.empty and len(downside_returns) > 1:
        downside_vol = downside_returns.std() * np.sqrt(trading_days)
        if downside_vol > 0:
            metrics["sortino_ratio"] = float((ann_return - rf_rate) / downside_vol)

    # Max Drawdown
    cum_returns = (1 + portfolio_returns).cumprod()
    running_max = cum_returns.cummax()
    drawdowns = (cum_returns - running_max) / running_max
    if not drawdowns.empty:
        metrics["max_drawdown"] = float(drawdowns.min())

    # Value at Risk 95% (Historical daily VaR converted to 1-day percentage loss)
    metrics["value_at_risk_95"] = float(-np.percentile(portfolio_returns, 5))

    # Beta
    if benchmark_returns is not None and not benchmark_returns.empty:
        # Align series
        df = pd.concat([portfolio_returns, benchmark_returns], axis=1).dropna()
        if len(df) > 5:
            cov_matrix = np.cov(df.iloc[:, 0], df.iloc[:, 1])
            market_variance = np.var(df.iloc[:, 1])
            if market_variance > 0:
                metrics["beta"] = float(cov_matrix[0, 1] / market_variance)

    return metrics
