import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal

@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient) -> dict:
    # Register and login a test user to get auth headers
    reg_data = {
        "email": "portfolio_test@stocksense.com",
        "password": "Password123",
        "full_name": "Portfolio Tester"
    }
    await client.post("/api/v1/auth/register", json=reg_data)
    login_response = await client.post(
        "/api/v1/auth/login", 
        json={"email": "portfolio_test@stocksense.com", "password": "Password123"}
    )
    token = login_response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_portfolio_lifecycle(client: AsyncClient, db_session: AsyncSession, auth_headers: dict):
    # 1. Create Portfolio
    port_data = {
        "name": "Retirement Fund",
        "description": "Long-term growth stocks",
        "currency": "USD",
        "is_default": True
    }
    response = await client.post("/api/v1/portfolios", json=port_data, headers=auth_headers)
    assert response.status_code == 201
    portfolio = response.json()["data"]
    assert portfolio["name"] == "Retirement Fund"
    portfolio_id = portfolio["id"]

    # 2. Add BUY transaction for AAPL
    tx_data = {
        "ticker": "AAPL",
        "type": "buy",
        "quantity": 10.0,
        "price": 150.0,
        "fee": 5.0,
        "notes": "First purchase",
        "executed_at": "2026-06-12T10:00:00Z"
    }
    response_tx = await client.post(
        f"/api/v1/transactions/portfolio/{portfolio_id}", 
        json=tx_data, 
        headers=auth_headers
    )
    assert response_tx.status_code == 201
    tx = response_tx.json()["data"]
    assert tx["ticker"] == "AAPL"
    # Total amount = 10 * 150 + 5 (fee) = 1505
    assert float(tx["total_amount"]) == 1505.0

    # 3. Check Holdings
    response_holdings = await client.get(
        f"/api/v1/portfolios/{portfolio_id}/holdings", 
        headers=auth_headers
    )
    assert response_holdings.status_code == 200
    holdings = response_holdings.json()["data"]
    assert len(holdings) == 1
    aapl_holding = holdings[0]
    assert aapl_holding["ticker"] == "AAPL"
    assert float(aapl_holding["quantity"]) == 10.0
    # Avg buy price = 1505 / 10 = 150.5
    assert float(aapl_holding["avg_buy_price"]) == 150.5

    # 4. Add another BUY transaction for AAPL
    tx_data2 = {
        "ticker": "AAPL",
        "type": "buy",
        "quantity": 10.0,
        "price": 160.0,
        "fee": 5.0,
        "notes": "Second purchase",
        "executed_at": "2026-06-12T11:00:00Z"
    }
    await client.post(
        f"/api/v1/transactions/portfolio/{portfolio_id}", 
        json=tx_data2, 
        headers=auth_headers
    )
    
    # Check Holdings again
    response_holdings = await client.get(
        f"/api/v1/portfolios/{portfolio_id}/holdings", 
        headers=auth_headers
    )
    holdings = response_holdings.json()["data"]
    aapl_holding = holdings[0]
    # Total Qty = 20. Total Cost = 1505 + (10 * 160 + 5) = 1505 + 1605 = 3110
    # Avg price = 3110 / 20 = 155.5
    assert float(aapl_holding["quantity"]) == 20.0
    assert float(aapl_holding["avg_buy_price"]) == 155.5

    # 5. Sell part of holding
    tx_sell = {
        "ticker": "AAPL",
        "type": "sell",
        "quantity": 5.0,
        "price": 170.0,
        "fee": 10.0,
        "notes": "Take some profit",
        "executed_at": "2026-06-12T12:00:00Z"
    }
    response_sell = await client.post(
        f"/api/v1/transactions/portfolio/{portfolio_id}", 
        json=tx_sell, 
        headers=auth_headers
    )
    assert response_sell.status_code == 201
    
    # Check holdings: quantity should be 15, avg buy price remains 155.5
    response_holdings = await client.get(
        f"/api/v1/portfolios/{portfolio_id}/holdings", 
        headers=auth_headers
    )
    holdings = response_holdings.json()["data"]
    aapl_holding = holdings[0]
    assert float(aapl_holding["quantity"]) == 15.0
    assert float(aapl_holding["avg_buy_price"]) == 155.5

    # 6. Test over-selling error
    tx_over_sell = {
        "ticker": "AAPL",
        "type": "sell",
        "quantity": 20.0,
        "price": 170.0,
        "fee": 5.0,
        "notes": "Sell more than owned",
        "executed_at": "2026-06-12T13:00:00Z"
    }
    response_err = await client.post(
        f"/api/v1/transactions/portfolio/{portfolio_id}", 
        json=tx_over_sell, 
        headers=auth_headers
    )
    assert response_err.status_code == 400
    assert response_err.json()["error"]["code"] == "INVALID_TRANSACTION"
