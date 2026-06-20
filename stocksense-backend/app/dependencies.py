from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.core.security import decode_token
from app.models.user import User
from app.core.exceptions import StockSenseException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Extract and validate the active user from the JWT token."""
    credentials_exception = StockSenseException(
        code="AUTH_INVALID_CREDENTIALS",
        message="Could not validate credentials",
        status_code=status.HTTP_412_PRECONDITION_FAILED # or 401
    )
    
    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")
        
        if user_id is None or token_type != "access":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # Query the user from the database
    import uuid
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalars().first()
    
    if user is None:
        raise StockSenseException(
            code="USER_NOT_FOUND",
            message="The authenticated user was not found",
            status_code=status.HTTP_404_NOT_FOUND
        )
        
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure the current user is active."""
    if not current_user.is_active:
        raise StockSenseException(
            code="AUTH_INSUFFICIENT_PERMISSIONS",
            message="User account is inactive",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    return current_user

async def require_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Ensure the active user has admin permissions."""
    if current_user.role != "admin":
        raise StockSenseException(
            code="AUTH_INSUFFICIENT_PERMISSIONS",
            message="Admin access required",
            status_code=status.HTTP_403_FORBIDDEN
        )
    return current_user
