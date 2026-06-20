import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch
import pandas as pd
import numpy as np
from datetime import datetime, date

@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient) -> dict:
    reg_data = {
        "email": "bt_test@stocksense.com",
        "password": "Password123",
        "full_name": "BT Tester"
    }
    await client.post("/api/v1/auth/register", json=reg_data)
    login_response = await client.post(
        "/api/v1/auth/login", 
        json={"email": "bt_test@stocksense.com", "password": "Password123"}
    )
    token = login_response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_backtest_simulation(client: AsyncClient, db_session: AsyncSession, auth_headers: dict):
    # 1. Create a portfolio
    port_response = await client.post(
        "/api/v1/portfolios", 
        json={"name": "BT Portfolio"}, 
        headers=auth_headers
    )
    portfolio_id = port_response.json()["data"]["id"]

    # 2. Add BUY transaction
    tx_data = {
        "ticker": "AAPL",
        "type": "buy",
        "quantity": 10.0,
        "price": 100.0,
        "executed_at": "2026-01-01T10:00:00Z"
    }
    await client.post(
        f"/api/v1/transactions/portfolio/{portfolio_id}", 
        json=tx_data, 
        headers=auth_headers
    )

    # 3. Setup Mock Price History (covering dates)
    dates = pd.date_range(start="2026-01-01", end="2026-01-10", freq="D")
    aapl_df = pd.DataFrame({"Close": np.linspace(100.0, 110.0, len(dates))}, index=dates)
    spy_df = pd.DataFrame({"Close": np.linspace(400.0, 410.0, len(dates))}, index=dates)

    async def mock_get_history(db, ticker, period="1y", interval="1d"):
        if ticker == "AAPL":
            return aapl_df
        elif ticker == "SPY":
            return spy_df
        return pd.DataFrame()

    with patch(
        "app.services.market.cache.CachedMarketService.get_history", 
        new_callable=AsyncMock, 
        side_effect=mock_get_history
    ):
        # 4. Trigger Backtest Run
        req_data = {
            "portfolio_id": portfolio_id,
            "name": "January Test Run",
            "start_date": "2026-01-01",
            "end_date": "2026-01-10",
            "initial_value": 10000.0
        }
        response = await client.post("/api/v1/backtests", json=req_data, headers=auth_headers)
        assert response.status_code == 201
        res = response.json()["data"]
        
        assert res["name"] == "January Test Run"
        assert res["status"] == "completed"
        assert float(res["final_value"]) > 10000.0
        assert float(res["cagr"]) > 0.0
        assert res["result_json"] is not None
        assert "chart_data" in res["result_json"]
        
        backtest_id = res["id"]

        # 5. List Backtests for portfolio
        list_response = await client.get(
            f"/api/v1/backtests/portfolio/{portfolio_id}", 
            headers=auth_headers
        )
        assert list_response.status_code == 200
        assert len(list_response.json()["data"]) == 1

        # 6. Fetch details by ID
        get_response = await client.get(
            f"/api/v1/backtests/{backtest_id}", 
            headers=auth_headers
        )
        assert get_response.status_code == 200
        assert get_response.json()["data"]["name"] == "January Test Run"

        # 7. Delete Backtest
        del_response = await client.delete(
            f"/api/v1/backtests/{backtest_id}", 
            headers=auth_headers
        )
        assert del_response.status_code == 200
