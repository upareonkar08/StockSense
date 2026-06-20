import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User

@pytest.mark.asyncio
async def test_user_registration_and_login(client: AsyncClient, db_session: AsyncSession):
    # 1. Test Register
    reg_data = {
        "email": "test@stocksense.com",
        "password": "Password123",
        "full_name": "Test User"
    }
    response = await client.post("/api/v1/auth/register", json=reg_data)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["success"] is True
    assert "access_token" in res_json["data"]
    assert "refresh_token" in res_json["data"]
    assert res_json["data"]["user"]["email"] == "test@stocksense.com"

    # 2. Test Duplicate Register
    response_dup = await client.post("/api/v1/auth/register", json=reg_data)
    assert response_dup.status_code == 400
    assert response_dup.json()["error"]["code"] == "USER_EMAIL_EXISTS"

    # 3. Test Invalid Password Strength (lacks uppercase)
    invalid_pwd_data = {
        "email": "weak@stocksense.com",
        "password": "password123",
        "full_name": "Weak User"
    }
    response_invalid = await client.post("/api/v1/auth/register", json=invalid_pwd_data)
    assert response_invalid.status_code == 400
    assert "at least one uppercase letter" in response_invalid.json()["error"]["message"]

    # 4. Test Login
    login_data = {
        "email": "test@stocksense.com",
        "password": "Password123"
    }
    response_login = await client.post("/api/v1/auth/login", json=login_data)
    assert response_login.status_code == 200
    login_res = response_login.json()
    assert login_res["success"] is True
    assert "access_token" in login_res["data"]
    access_token = login_res["data"]["access_token"]
    refresh_token = login_res["data"]["refresh_token"]

    # 5. Test Invalid Login
    wrong_login_data = {
        "email": "test@stocksense.com",
        "password": "WrongPassword"
    }
    response_wrong = await client.post("/api/v1/auth/login", json=wrong_login_data)
    assert response_wrong.status_code == 401
    assert response_wrong.json()["error"]["code"] == "AUTH_INVALID_CREDENTIALS"

    # 6. Test Refresh Token
    refresh_response = await client.post(
        "/api/v1/auth/refresh", 
        json={"refresh_token": refresh_token}
    )
    assert refresh_response.status_code == 200
    assert "access_token" in refresh_response.json()["data"]

    # 7. Test Fetch Profile (Authenticated)
    headers = {"Authorization": f"Bearer {access_token}"}
    response_profile = await client.get("/api/v1/users/profile", headers=headers)
    assert response_profile.status_code == 200
    assert response_profile.json()["data"]["email"] == "test@stocksense.com"

    # 8. Test Fetch Preferences
    response_prefs = await client.get("/api/v1/users/preferences", headers=headers)
    assert response_prefs.status_code == 200
    assert response_prefs.json()["data"]["benchmark_ticker"] == "SPY"

    # 9. Test Update Preferences
    update_data = {
        "risk_tolerance": "aggressive",
        "investment_horizon": "long",
        "currency": "USD",
        "benchmark_ticker": "QQQ",
        "notification_email": False
    }
    response_update = await client.put("/api/v1/users/preferences", json=update_data, headers=headers)
    assert response_update.status_code == 200
    assert response_update.json()["data"]["benchmark_ticker"] == "QQQ"
    assert response_update.json()["data"]["risk_tolerance"] == "aggressive"
