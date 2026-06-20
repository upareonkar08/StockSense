import asyncio
import yfinance as yf
import pandas as pd
from typing import Any, Dict
from app.services.market.base import BaseMarketProvider

class YahooFinanceProvider(BaseMarketProvider):
    async def get_price(self, ticker: str) -> float:
        """Fetch the current price of a security from Yahoo Finance in a non-blocking thread."""
        def fetch():
            t = yf.Ticker(ticker)
            try:
                # fast_info is typically faster and does not load the entire page
                price = t.fast_info.get("last_price")
                if price is not None:
                    return float(price)
            except Exception:
                pass
                
            try:
                # Fallback to info dict
                info = t.info
                price = info.get("regularMarketPrice") or info.get("previousClose") or info.get("currentPrice")
                if price is not None:
                    return float(price)
            except Exception:
                pass
                
            # Ultimate fallback: fetch history
            try:
                hist = t.history(period="1d")
                if not hist.empty:
                    return float(hist["Close"].iloc[-1])
            except Exception:
                pass
                
            raise ValueError(f"Could not retrieve price for ticker {ticker}")
            
        return await asyncio.to_thread(fetch)

    async def get_history(self, ticker: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame:
        """Fetch historical price data in a non-blocking thread."""
        def fetch():
            t = yf.Ticker(ticker)
            df = t.history(period=period, interval=interval)
            return df
        return await asyncio.to_thread(fetch)

    async def get_info(self, ticker: str) -> Dict[str, Any]:
        """Fetch metadata for a security in a non-blocking thread."""
        def fetch():
            t = yf.Ticker(ticker)
            try:
                info = t.info
            except Exception:
                info = {}
            return {
                "name": info.get("longName") or info.get("shortName") or ticker,
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "country": info.get("country"),
                "asset_type": info.get("quoteType", "EQUITY")
            }
        return await asyncio.to_thread(fetch)
