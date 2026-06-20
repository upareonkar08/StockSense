import numpy as np
import pandas as pd
from scipy.optimize import minimize
from typing import Dict, List, Tuple

def optimize_risk_parity(
    price_history: Dict[str, pd.Series],
    min_weight: float = 0.0,
    max_weight: float = 1.0
) -> Tuple[Dict[str, float], float, float, float]:
    """Perform Risk Parity Optimization using SciPy.
    
    Risk parity seeks weights such that each asset contributes equally to overall portfolio risk.
    """
    tickers = list(price_history.keys())
    n = len(tickers)
    
    if n == 0:
        return {}, 0.0, 0.0, 0.0
    if n == 1:
        ticker = tickers[0]
        hist = price_history[ticker]
        if hist.empty or len(hist) < 2:
            return {ticker: 1.0}, 0.0, 0.0, 0.0
        ret = hist.pct_change().dropna()
        ann_ret = float(ret.mean() * 252)
        ann_vol = float(ret.std() * np.sqrt(252))
        return {ticker: 1.0}, ann_ret, ann_vol, 0.0

    # Compute daily returns
    returns_dict = {}
    for ticker, series in price_history.items():
        if not series.empty:
            returns_dict[ticker] = series.pct_change().dropna()
            
    df_returns = pd.DataFrame(returns_dict).ffill().bfill()
    
    # Calculate expected returns and covariance matrix
    mean_returns = df_returns.mean() * 252
    cov_matrix = df_returns.cov() * 252
    
    mean_vals = mean_returns.values
    cov_vals = cov_matrix.values
    
    # Initial weights guess (equally weighted)
    init_weights = np.ones(n) / n
    
    # Constraints: sum of weights is 1
    constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
    
    # Bounds for each asset (cannot be less than min_weight or greater than max_weight)
    # Note: risk parity requires w_i > 0 to have risk contribution, so force min_weight to at least 0.001
    actual_min_weight = max(0.001, min_weight)
    bounds = tuple((actual_min_weight, max_weight) for _ in range(n))
    
    def get_portfolio_stats(w):
        p_return = np.dot(w, mean_vals)
        p_vol = np.sqrt(np.dot(w.T, np.dot(cov_vals, w)))
        p_sharpe = (p_return - 0.02) / p_vol if p_vol > 0 else 0.0
        return p_return, p_vol, p_sharpe

    def risk_parity_objective(w):
        p_vol = np.sqrt(np.dot(w.T, np.dot(cov_vals, w)))
        if p_vol <= 0:
            return 0.0
        # Marginal Risk Contribution
        mrc = np.dot(cov_vals, w) / p_vol
        # Risk Contribution of each asset
        rc = w * mrc
        # Squared differences between risk contributions
        target_rc = p_vol / n
        return np.sum((rc - target_rc) ** 2)
        
    result = minimize(
        risk_parity_objective,
        init_weights,
        method="SLSQP",
        bounds=bounds,
        constraints=constraints
    )
    
    if not result.success:
        opt_weights = init_weights
    else:
        opt_weights = result.x
        
    # Re-normalize
    opt_weights = np.clip(opt_weights, actual_min_weight, max_weight)
    opt_weights = opt_weights / np.sum(opt_weights)
    
    opt_return, opt_vol, opt_sharpe = get_portfolio_stats(opt_weights)
    weights_dict = {tickers[i]: float(opt_weights[i]) for i in range(n)}
    
    return weights_dict, float(opt_return), float(opt_vol), float(opt_sharpe)
