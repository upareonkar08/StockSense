import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import status
from app.models.user import User, UserPreferences
from app.schemas.auth import RegisterRequest, LoginRequest
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import StockSenseException
from jose import JWTError

def validate_password_strength(password: str) -> None:
    """Validate that password has at least 8 chars, 1 uppercase, and 1 number."""
    if len(password) < 8:
        raise StockSenseException(
            code="VALIDATION_ERROR",
            message="Password must be at least 8 characters long",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    if not re.search(r"[A-Z]", password):
        raise StockSenseException(
            code="VALIDATION_ERROR",
            message="Password must contain at least one uppercase letter",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    if not re.search(r"[0-9]", password):
        raise StockSenseException(
            code="VALIDATION_ERROR",
            message="Password must contain at least one number",
            status_code=status.HTTP_400_BAD_REQUEST
        )

async def register_user(db: AsyncSession, data: RegisterRequest) -> dict:
    # Check if email exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalars().first() is not None:
        raise StockSenseException(
            code="USER_EMAIL_EXISTS",
            message="A user with this email address already exists",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate password
    validate_password_strength(data.password)
    
    # Hash password
    hashed_pwd = hash_password(data.password)
    
    # Create user
    new_user = User(
        email=data.email,
        hashed_password=hashed_pwd,
        full_name=data.full_name
    )
    db.add(new_user)
    await db.flush() # get user id
    
    # Create default user preferences
    prefs = UserPreferences(user_id=new_user.id)
    db.add(prefs)
    
    await db.commit()
    await db.refresh(new_user)
    
    # Generate tokens
    access = create_access_token({"sub": str(new_user.id), "email": new_user.email, "role": new_user.role.value})
    refresh = create_refresh_token({"sub": str(new_user.id)})
    
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": new_user
    }

async def login_user(db: AsyncSession, data: LoginRequest) -> dict:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalars().first()
    
    if user is None or not verify_password(data.password, user.hashed_password):
        raise StockSenseException(
            code="AUTH_INVALID_CREDENTIALS",
            message="Invalid email or password",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        raise StockSenseException(
            code="AUTH_INSUFFICIENT_PERMISSIONS",
            message="User account is deactivated",
            status_code=status.HTTP_403_FORBIDDEN
        )
        
    # Generate tokens
    access = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role.value})
    refresh = create_refresh_token({"sub": str(user.id)})
    
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": user
    }

async def refresh_user_token(db: AsyncSession, refresh_token: str) -> dict:
    try:
        payload = decode_token(refresh_token)
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if user_id is None or token_type != "refresh":
            raise StockSenseException(
                code="AUTH_INVALID_CREDENTIALS",
                message="Invalid refresh token",
                status_code=status.HTTP_401_UNAUTHORIZED
            )
    except JWTError:
        raise StockSenseException(
            code="AUTH_INVALID_CREDENTIALS",
            message="Invalid or expired refresh token",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
        
    import uuid
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalars().first()
    
    if user is None or not user.is_active:
        raise StockSenseException(
            code="AUTH_INVALID_CREDENTIALS",
            message="User is inactive or not found",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
        
    access = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role.value})
    return {
        "access_token": access,
        "token_type": "bearer"
    }
