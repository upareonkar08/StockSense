import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch
import pandas as pd
import numpy as np
from datetime import datetime

@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient) -> dict:
    reg_data = {
        "email": "opt_test@stocksense.com",
        "password": "Password123",
        "full_name": "Opt Tester"
    }
    await client.post("/api/v1/auth/register", json=reg_data)
    login_response = await client.post(
        "/api/v1/auth/login", 
        json={"email": "opt_test@stocksense.com", "password": "Password123"}
    )
    token = login_response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_portfolio_optimization(client: AsyncClient, db_session: AsyncSession, auth_headers: dict):
    # Setup mock data for two tickers: AAPL and GOOGL
    dates = pd.date_range(end=datetime.now(), periods=10, freq="D")
    
    # AAPL returns: upward trend
    aapl_df = pd.DataFrame({"Close": np.linspace(100.0, 110.0, 10)}, index=dates)
    # GOOGL returns: downward trend
    googl_df = pd.DataFrame({"Close": np.linspace(100.0, 95.0, 10)}, index=dates)

    async def mock_get_history(db, ticker, period="1y", interval="1d"):
        if ticker == "AAPL":
            return aapl_df
        elif ticker == "GOOGL":
            return googl_df
        return pd.DataFrame()

    with patch(
        "app.services.market.cache.CachedMarketService.get_history", 
        new_callable=AsyncMock, 
        side_effect=mock_get_history
    ):
        # 1. Test Sharpe Optimization
        req_data = {
            "weights": {
                "AAPL": 0.5,
                "GOOGL": 0.5
            },
            "target": "sharpe",
            "min_weight": 0.0,
            "max_weight": 1.0
        }
        response = await client.post("/api/v1/optimization", json=req_data, headers=auth_headers)
        assert response.status_code == 200
        res = response.json()["data"]
        
        # Verify optimized weights are returned
        assert "AAPL" in res["optimized_weights"]
        assert "GOOGL" in res["optimized_weights"]
        # Since AAPL goes up and GOOGL goes down, AAPL weight should be higher
        assert res["optimized_weights"]["AAPL"] > res["optimized_weights"]["GOOGL"]
        assert float(res["expected_return"]) > -10.0
        
        # 2. Test Risk Parity Optimization
        req_data["target"] = "risk_parity"
        response_rp = await client.post("/api/v1/optimization", json=req_data, headers=auth_headers)
        assert response_rp.status_code == 200
        res_rp = response_rp.json()["data"]
        assert "AAPL" in res_rp["optimized_weights"]
        assert "GOOGL" in res_rp["optimized_weights"]
