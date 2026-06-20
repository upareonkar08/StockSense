from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest
from app.schemas.response import ResponseEnvelope
from app.services import auth_service

router = APIRouter()

@router.post("/register", response_model=ResponseEnvelope, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user account and return JWT access/refresh tokens."""
    result = await auth_service.register_user(db, data)
    from app.schemas.auth import TokenResponse
    return ResponseEnvelope(
        success=True,
        data=TokenResponse.model_validate(result),
        message="User registered successfully"
    )

@router.post("/login", response_model=ResponseEnvelope)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate email/password and return active JWT access/refresh tokens."""
    result = await auth_service.login_user(db, data)
    from app.schemas.auth import TokenResponse
    return ResponseEnvelope(
        success=True,
        data=TokenResponse.model_validate(result),
        message="Login successful"
    )

@router.post("/refresh", response_model=ResponseEnvelope)
async def refresh(
    data: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    """Issue a new JWT access token using an active refresh token."""
    result = await auth_service.refresh_user_token(db, data.refresh_token)
    return ResponseEnvelope(
        success=True,
        data=result,
        message="Token refreshed successfully"
    )

@router.post("/logout", response_model=ResponseEnvelope)
async def logout():
    """Sign out the current active session."""
    return ResponseEnvelope(
        success=True,
        data=None,
        message="Logout successful"
    )
