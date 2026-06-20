from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import pandas as pd

class BaseMarketProvider(ABC):
    @abstractmethod
    async def get_price(self, ticker: str) -> float:
        """Fetch the current price of a security."""
        pass

    @abstractmethod
    async def get_history(self, ticker: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame:
        """Fetch historical price data as a pandas DataFrame with datetime index."""
        pass

    @abstractmethod
    async def get_info(self, ticker: str) -> Dict[str, Any]:
        """Fetch metadata for a security (e.g. name, sector, industry, country, asset type)."""
        pass
