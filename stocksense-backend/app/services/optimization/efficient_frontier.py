import numpy as np
import pandas as pd
from scipy.optimize import minimize
from typing import Dict, List, Tuple

def optimize_mean_variance(
    price_history: Dict[str, pd.Series],
    target: str = "sharpe",  # "sharpe" or "volatility"
    rf_rate: float = 0.02,
    min_weight: float = 0.0,
    max_weight: float = 1.0
) -> Tuple[Dict[str, float], float, float, float]:
    """Perform Mean-Variance Optimization using SciPy.
    
    Returns: (optimized_weights, expected_return, expected_volatility, expected_sharpe)
    """
    tickers = list(price_history.keys())
    n = len(tickers)
    
    if n == 0:
        return {}, 0.0, 0.0, 0.0
    if n == 1:
        # 100% allocation to the single asset
        ticker = tickers[0]
        hist = price_history[ticker]
        if hist.empty or len(hist) < 2:
            return {ticker: 1.0}, 0.0, 0.0, 0.0
        ret = hist.pct_change().dropna()
        ann_ret = float(ret.mean() * 252)
        ann_vol = float(ret.std() * np.sqrt(252))
        ann_sharpe = (ann_ret - rf_rate) / ann_vol if ann_vol > 0 else 0.0
        return {ticker: 1.0}, ann_ret, ann_vol, ann_sharpe

    # Compute daily returns
    returns_dict = {}
    for ticker, series in price_history.items():
        if not series.empty:
            returns_dict[ticker] = series.pct_change().dropna()
            
    df_returns = pd.DataFrame(returns_dict).ffill().bfill()
    
    # Calculate annualized expected returns and covariance matrix
    mean_returns = df_returns.mean() * 252
    cov_matrix = df_returns.cov() * 252
    
    # Ensure they have values
    mean_vals = mean_returns.values
    cov_vals = cov_matrix.values
    
    # Initial weights guess (equally weighted)
    init_weights = np.ones(n) / n
    
    # Constraints: sum of weights is 1
    constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
    
    # Bounds for each asset
    bounds = tuple((min_weight, max_weight) for _ in range(n))
    
    def get_portfolio_stats(w):
        p_return = np.dot(w, mean_vals)
        p_vol = np.sqrt(np.dot(w.T, np.dot(cov_vals, w)))
        p_sharpe = (p_return - rf_rate) / p_vol if p_vol > 0 else 0.0
        return p_return, p_vol, p_sharpe

    if target == "sharpe":
        # Maximize Sharpe = Minimize Negative Sharpe
        objective = lambda w: -get_portfolio_stats(w)[2]
    else:
        # Minimize Volatility
        objective = lambda w: get_portfolio_stats(w)[1]
        
    result = minimize(
        objective,
        init_weights,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints
    )
    
    if not result.success:
        # Fallback to equal weight if optimization fails
        opt_weights = init_weights
    else:
        opt_weights = result.x
        
    # Clean weights (round tiny values to 0 and re-normalize)
    opt_weights = np.clip(opt_weights, min_weight, max_weight)
    opt_weights = opt_weights / np.sum(opt_weights)
    
    opt_return, opt_vol, opt_sharpe = get_portfolio_stats(opt_weights)
    
    weights_dict = {tickers[i]: float(opt_weights[i]) for i in range(n)}
    
    return weights_dict, float(opt_return), float(opt_vol), float(opt_sharpe)
