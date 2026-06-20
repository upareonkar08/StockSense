import uuid
from datetime import date, datetime
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import status

from app.models.backtest import Backtest
from app.models.enums import BacktestStatus
from app.services.market.cache import CachedMarketService
from app.services.backtest.metrics import calculate_backtest_metrics
from app.core.exceptions import StockSenseException

async def run_backtest_simulation(
    db: AsyncSession,
    portfolio_id: uuid.UUID,
    user_id: uuid.UUID,
    start_date: date,
    end_date: date,
    initial_value: float,
    market_service: CachedMarketService,
    weights: Dict[str, float],
    name: Optional[str] = None
) -> Backtest:
    """Run a historical backtest simulation and save the result to the database."""
    now = datetime.utcnow()
    
    # Create the pending backtest record
    backtest = Backtest(
        portfolio_id=portfolio_id,
        user_id=user_id,
        name=name or f"Backtest {start_date} to {end_date}",
        start_date=start_date,
        end_date=end_date,
        initial_value=initial_value,
        status=BacktestStatus.RUNNING
    )
    db.add(backtest)
    await db.commit()
    await db.refresh(backtest)

    try:
        tickers = list(weights.keys())
        if not tickers:
            raise ValueError("No tickers in portfolio to backtest.")

        # 1. Fetch historical prices for all tickers
        # Note: yfinance takes string date formats or date objects
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")
        
        price_history = {}
        for ticker in tickers:
            df = await market_service.get_history(db, ticker, period="custom", interval="1d")
            # Filter history by date range
            if not df.empty and "Close" in df.columns:
                df_filtered = df.loc[start_str:end_str] # type: ignore
                if not df_filtered.empty:
                    price_history[ticker] = df_filtered["Close"]

        # Fetch SPY benchmark history
        benchmark_history = pd.Series(dtype=float)
        try:
            df_spy = await market_service.get_history(db, "SPY", period="custom", interval="1d")
            if not df_spy.empty and "Close" in df_spy.columns:
                df_spy_filtered = df_spy.loc[start_str:end_str] # type: ignore
                if not df_spy_filtered.empty:
                    benchmark_history = df_spy_filtered["Close"]
        except Exception:
            pass

        if not price_history:
            raise ValueError("No price history found for portfolio assets in date range.")

        # 2. Align prices
        df_prices = pd.DataFrame(price_history).ffill().bfill()
        
        # 3. Simulate buy & hold
        first_date = df_prices.index[0]
        shares = {}
        for ticker, w in weights.items():
            if ticker in df_prices.columns:
                first_price = float(df_prices.loc[first_date, ticker])
                if first_price > 0:
                    shares[ticker] = (initial_value * w) / first_price
                else:
                    shares[ticker] = 0.0

        equity_curve_list = []
        for dt, row in df_prices.iterrows():
            portfolio_val = 0.0
            for ticker, sh in shares.items():
                if ticker in row:
                    portfolio_val += sh * float(row[ticker])
            equity_curve_list.append((dt, portfolio_val))

        df_equity = pd.DataFrame(equity_curve_list, columns=["Date", "Value"]).set_index("Date")["Value"]

        # 4. Simulate Benchmark
        if not benchmark_history.empty:
            # Align benchmark dates with portfolio dates
            benchmark_history = benchmark_history.reindex(df_equity.index).ffill().bfill()
            spy_first_price = float(benchmark_history.iloc[0])
            if spy_first_price > 0:
                spy_shares = initial_value / spy_first_price
                df_benchmark = benchmark_history * spy_shares
            else:
                df_benchmark = pd.Series(initial_value, index=df_equity.index)
        else:
            df_benchmark = pd.Series(initial_value, index=df_equity.index)

        # 5. Calculate Metrics
        metrics = calculate_backtest_metrics(df_equity, df_benchmark, initial_value)

        # 6. Format result json
        # Store time-series data for front-end charts
        chart_data = []
        for idx in range(len(df_equity)):
            dt_str = df_equity.index[idx].strftime("%Y-%m-%d")
            chart_data.append({
                "date": dt_str,
                "portfolio_value": float(round(df_equity.iloc[idx], 2)),
                "benchmark_value": float(round(df_benchmark.iloc[idx], 2))
            })

        # Save results
        backtest.final_value = metrics["final_value"]
        backtest.cagr = metrics["cagr"]
        backtest.sharpe_ratio = metrics["sharpe_ratio"]
        backtest.sortino_ratio = metrics["sortino_ratio"]
        backtest.max_drawdown = metrics["max_drawdown"]
        backtest.volatility = metrics["volatility"]
        backtest.calmar_ratio = metrics["calmar_ratio"]
        backtest.benchmark_return = metrics["benchmark_return"]
        backtest.result_json = {
            "chart_data": chart_data,
            "win_rate": metrics["win_rate"],
            "total_return": metrics["total_return"]
        }
        backtest.status = BacktestStatus.COMPLETED

    except Exception as e:
        backtest.status = BacktestStatus.FAILED
        backtest.result_json = {"error": str(e)}
        
    backtest.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(backtest)
    return backtest
