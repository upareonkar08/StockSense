import numpy as np
import pandas as pd
from typing import Dict, Any

def calculate_backtest_metrics(
    equity_curve: pd.Series,
    benchmark_curve: pd.Series,
    initial_value: float,
    rf_rate: float = 0.02
) -> Dict[str, Any]:
    """Calculate comprehensive walk-forward backtest statistics.
    
    equity_curve: daily portfolio value series
    benchmark_curve: daily benchmark value series
    """
    metrics = {
        "final_value": initial_value,
        "total_return": 0.0,
        "cagr": 0.0,
        "volatility": 0.0,
        "sharpe_ratio": 0.0,
        "sortino_ratio": 0.0,
        "max_drawdown": 0.0,
        "calmar_ratio": 0.0,
        "benchmark_return": 0.0,
        "win_rate": 0.0
    }

    if equity_curve.empty or len(equity_curve) < 5:
        return metrics

    trading_days = 252
    years = len(equity_curve) / trading_days
    if years <= 0:
        years = 1.0 / trading_days

    # Daily returns
    returns = equity_curve.pct_change().dropna()
    bench_returns = benchmark_curve.pct_change().dropna() if not benchmark_curve.empty else pd.Series()

    final_val = float(equity_curve.iloc[-1])
    metrics["final_value"] = final_val
    metrics["total_return"] = float((final_val - initial_value) / initial_value)

    # CAGR
    cagr_val = (final_val / initial_value) ** (1.0 / years) - 1.0
    metrics["cagr"] = float(cagr_val)

    # Volatility
    daily_vol = returns.std()
    ann_vol = daily_vol * np.sqrt(trading_days)
    metrics["volatility"] = float(ann_vol)

    # Sharpe Ratio
    ann_return = returns.mean() * trading_days
    if ann_vol > 0:
        metrics["sharpe_ratio"] = float((ann_return - rf_rate) / ann_vol)

    # Sortino Ratio
    downside_returns = returns[returns < 0]
    if not downside_returns.empty and len(downside_returns) > 1:
        downside_vol = downside_returns.std() * np.sqrt(trading_days)
        if downside_vol > 0:
            metrics["sortino_ratio"] = float((ann_return - rf_rate) / downside_vol)

    # Max Drawdown
    running_max = equity_curve.cummax()
    drawdowns = (equity_curve - running_max) / running_max
    max_dd = float(drawdowns.min())
    metrics["max_drawdown"] = max_dd

    # Calmar Ratio
    if abs(max_dd) > 0:
        metrics["calmar_ratio"] = float(cagr_val / abs(max_dd))

    # Benchmark Return
    if not benchmark_curve.empty and len(benchmark_curve) > 1:
        bench_initial = float(benchmark_curve.iloc[0])
        bench_final = float(benchmark_curve.iloc[-1])
        if bench_initial > 0:
            metrics["benchmark_return"] = float((bench_final - bench_initial) / bench_initial)

    # Win Rate (percentage of positive return days)
    if not returns.empty:
        positive_days = (returns > 0).sum()
        metrics["win_rate"] = float(positive_days / len(returns))

    return metrics
