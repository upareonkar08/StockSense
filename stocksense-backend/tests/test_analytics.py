import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from decimal import Decimal

@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient) -> dict:
    reg_data = {
        "email": "analytics_test@stocksense.com",
        "password": "Password123",
        "full_name": "Analytics Tester"
    }
    await client.post("/api/v1/auth/register", json=reg_data)
    login_response = await client.post(
        "/api/v1/auth/login", 
        json={"email": "analytics_test@stocksense.com", "password": "Password123"}
    )
    token = login_response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_portfolio_diagnostics_calculation(
    client: AsyncClient, 
    db_session: AsyncSession, 
    auth_headers: dict
):
    # 1. Create a portfolio
    port_data = {
        "name": "Growth Stocks",
        "description": "Tech heavy portfolio",
        "currency": "USD",
        "is_default": True
    }
    response = await client.post("/api/v1/portfolios", json=port_data, headers=auth_headers)
    portfolio_id = response.json()["data"]["id"]

    # 2. Add BUY transaction for AAPL
    tx_data = {
        "ticker": "AAPL",
        "type": "buy",
        "quantity": 10.0,
        "price": 150.0,
        "fee": 0.0,
        "notes": "Buy AAPL",
        "executed_at": "2026-06-12T10:00:00Z"
    }
    await client.post(
        f"/api/v1/transactions/portfolio/{portfolio_id}", 
        json=tx_data, 
        headers=auth_headers
    )

    # 3. Define mock history data
    dates = pd.date_range(end=datetime.now(), periods=10, freq="D")
    mock_df = pd.DataFrame({"Close": np.linspace(140.0, 160.0, 10)}, index=dates)

    # Mock CachedMarketService dependencies to run offline
    with patch(
        "app.services.market.cache.CachedMarketService.get_price", 
        new_callable=AsyncMock, 
        return_value=160.0
    ) as mock_price, patch(
        "app.services.market.cache.CachedMarketService.get_info", 
        new_callable=AsyncMock, 
        return_value={"name": "Apple Inc.", "sector": "Technology", "industry": "Consumer Electronics", "asset_type": "EQUITY"}
    ) as mock_info, patch(
        "app.services.market.cache.CachedMarketService.get_history", 
        new_callable=AsyncMock, 
        return_value=mock_df
    ) as mock_history:

        # Get diagnostics report
        response_diag = await client.get(
            f"/api/v1/portfolios/{portfolio_id}/diagnostics", 
            headers=auth_headers
        )
        assert response_diag.status_code == 200
        diag = response_diag.json()["data"]
        
        # Verify calculated values
        # Total cost basis = 10 * 150 = 1500
        # Total market value = 10 * 160 (mocked) = 1600
        # Unrealized gain = 1600 - 1500 = 100
        # Unrealized gain percent = 100 / 1500 = 0.0667
        assert float(diag["total_cost_basis"]) == 1500.0
        assert float(diag["total_market_value"]) == 1600.0
        assert float(diag["total_unrealized_gain"]) == 100.0
        assert round(float(diag["total_unrealized_gain_percent"]), 4) == 0.0667
        
        # Verify allocations
        assert float(diag["sector_allocations"]["Technology"]) == 1.0
        assert float(diag["asset_type_allocations"]["EQUITY"]) == 1.0
        assert float(diag["individual_holding_weights"]["AAPL"]) == 1.0
        
        # Verify health score calculation (non-zero)
        assert diag["health_score"] > 0
