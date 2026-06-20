import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch
import pandas as pd
from datetime import datetime

@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient) -> dict:
    reg_data = {
        "email": "ai_test@stocksense.com",
        "password": "Password123",
        "full_name": "AI Tester"
    }
    await client.post("/api/v1/auth/register", json=reg_data)
    login_response = await client.post(
        "/api/v1/auth/login", 
        json={"email": "ai_test@stocksense.com", "password": "Password123"}
    )
    token = login_response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_ai_tutor_agent(client: AsyncClient):
    # Test query about Sharpe
    response = await client.post(
        "/api/v1/ai/tutor", 
        json={"query": "Can you explain the Sharpe Ratio?"}
    )
    assert response.status_code == 200
    res = response.json()["data"]
    assert res["concept"] == "Sharpe Ratio"
    assert "excess return" in res["explanation"]
    assert "suggested_questions" in res

@pytest.mark.asyncio
async def test_ai_analyst_and_rebalancer(client: AsyncClient, db_session: AsyncSession, auth_headers: dict):
    # 1. Create portfolio
    port_response = await client.post(
        "/api/v1/portfolios", 
        json={"name": "AI Test Portfolio"}, 
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

    # Mock CachedMarketService dependencies to run offline
    dates = pd.date_range(end=datetime.now(), periods=10, freq="D")
    mock_df = pd.DataFrame({"Close": [100.0]*10}, index=dates)

    with patch(
        "app.services.market.cache.CachedMarketService.get_price", 
        new_callable=AsyncMock, 
        return_value=100.0
    ) as mock_price, patch(
        "app.services.market.cache.CachedMarketService.get_info", 
        new_callable=AsyncMock, 
        return_value={"name": "Apple Inc.", "sector": "Technology", "industry": "Consumer Electronics", "asset_type": "EQUITY"}
    ) as mock_info, patch(
        "app.services.market.cache.CachedMarketService.get_history", 
        new_callable=AsyncMock, 
        return_value=mock_df
    ) as mock_history:

        # 3. Test AI Analyst
        analyst_response = await client.post(
            "/api/v1/ai/analyst", 
            json={"portfolio_id": portfolio_id}, 
            headers=auth_headers
        )
        assert analyst_response.status_code == 200
        analyst_data = analyst_response.json()["data"]
        assert "portfolio_status" in analyst_data
        assert "key_insights" in analyst_data
        assert "actionable_recommendations" in analyst_data

        # 4. Test AI Rebalancer
        # We want to rebalance from 100% AAPL to 50% AAPL and 50% MSFT
        rebalance_response = await client.post(
            "/api/v1/ai/rebalance", 
            json={
                "portfolio_id": portfolio_id,
                "target_weights": {
                    "AAPL": 0.5,
                    "MSFT": 0.5
                }
            },
            headers=auth_headers
        )
        assert rebalance_response.status_code == 200
        rebalance_data = rebalance_response.json()["data"]
        assert "total_portfolio_value" in rebalance_data
        assert float(rebalance_data["total_portfolio_value"]) == 1000.0 # 10 shares * 100.0
        assert len(rebalance_data["trades"]) == 2
        
        # Sells first: AAPL target weight is 50% ($500), current is $1000, so Sell $500 (5 shares)
        # Buys next: MSFT target weight is 50% ($500), current is $0, so Buy $500 (5 shares @ 100.0 mock)
        trades = rebalance_data["trades"]
        assert trades[0]["ticker"] == "AAPL"
        assert trades[0]["action"] == "SELL"
        assert float(trades[0]["shares"]) == 5.0
        assert float(trades[0]["estimated_value"]) == 500.0

        assert trades[1]["ticker"] == "MSFT"
        assert trades[1]["action"] == "BUY"
        assert float(trades[1]["shares"]) == 5.0
        assert float(trades[1]["estimated_value"]) == 500.0
