import json
from datetime import datetime, timedelta
from typing import Any, Dict
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.market_cache import MarketCache
from app.models.enums import MarketDataType
from app.services.market.yahoo_finance import YahooFinanceProvider

class CachedMarketService:
    def __init__(self, provider: YahooFinanceProvider = None):
        self.provider = provider or YahooFinanceProvider()

    async def get_price(self, db: AsyncSession, ticker: str) -> float:
        """Get security price from cache, falling back to live fetch if expired or missing."""
        ticker = ticker.upper().strip()
        now = datetime.utcnow()
        
        result = await db.execute(
            select(MarketCache).where(
                MarketCache.ticker == ticker,
                MarketCache.data_type == MarketDataType.QUOTE,
                MarketCache.expires_at > now
            )
        )
        cached = result.scalars().first()
        if cached:
            return float(cached.payload.get("price"))

        # Fetch live price
        price = await self.provider.get_price(ticker)

        # Update cache
        expires = now + timedelta(minutes=5)
        exist_result = await db.execute(
            select(MarketCache).where(
                MarketCache.ticker == ticker,
                MarketCache.data_type == MarketDataType.QUOTE
            )
        )
        entry = exist_result.scalars().first()
        if entry:
            entry.payload = {"price": price}
            entry.fetched_at = now
            entry.expires_at = expires
        else:
            entry = MarketCache(
                ticker=ticker,
                data_type=MarketDataType.QUOTE,
                payload={"price": price},
                fetched_at=now,
                expires_at=expires
            )
            db.add(entry)
            
        await db.commit()
        return price

    async def get_info(self, db: AsyncSession, ticker: str) -> Dict[str, Any]:
        """Get security metadata from cache, falling back to live fetch."""
        ticker = ticker.upper().strip()
        now = datetime.utcnow()
        
        result = await db.execute(
            select(MarketCache).where(
                MarketCache.ticker == ticker,
                MarketCache.data_type == MarketDataType.INFO,
                MarketCache.expires_at > now
            )
        )
        cached = result.scalars().first()
        if cached:
            return cached.payload

        # Fetch live info
        info = await self.provider.get_info(ticker)

        # Update cache
        expires = now + timedelta(days=7)
        exist_result = await db.execute(
            select(MarketCache).where(
                MarketCache.ticker == ticker,
                MarketCache.data_type == MarketDataType.INFO
            )
        )
        entry = exist_result.scalars().first()
        if entry:
            entry.payload = info
            entry.fetched_at = now
            entry.expires_at = expires
        else:
            entry = MarketCache(
                ticker=ticker,
                data_type=MarketDataType.INFO,
                payload=info,
                fetched_at=now,
                expires_at=expires
            )
            db.add(entry)
            
        await db.commit()
        return info

    async def get_history(
        self, db: AsyncSession, ticker: str, period: str = "1y", interval: str = "1d"
    ) -> pd.DataFrame:
        """Get security price history from cache, falling back to live fetch."""
        ticker = ticker.upper().strip()
        now = datetime.utcnow()
        
        result = await db.execute(
            select(MarketCache).where(
                MarketCache.ticker == ticker,
                MarketCache.data_type == MarketDataType.HISTORY,
                MarketCache.period == period,
                MarketCache.interval == interval,
                MarketCache.expires_at > now
            )
        )
        cached = result.scalars().first()
        if cached:
            df = pd.read_json(json.dumps(cached.payload))
            if not df.empty:
                df.index = pd.to_datetime(df.index)
            return df

        # Fetch live history
        df = await self.provider.get_history(ticker, period, interval)
        payload = json.loads(df.to_json(date_format="iso"))

        # Update cache
        expires = now + timedelta(days=1)
        exist_result = await db.execute(
            select(MarketCache).where(
                MarketCache.ticker == ticker,
                MarketCache.data_type == MarketDataType.HISTORY,
                MarketCache.period == period,
                MarketCache.interval == interval
            )
        )
        entry = exist_result.scalars().first()
        if entry:
            entry.payload = payload
            entry.fetched_at = now
            entry.expires_at = expires
        else:
            entry = MarketCache(
                ticker=ticker,
                data_type=MarketDataType.HISTORY,
                period=period,
                interval=interval,
                payload=payload,
                fetched_at=now,
                expires_at=expires
            )
            db.add(entry)
            
        await db.commit()
        return df
