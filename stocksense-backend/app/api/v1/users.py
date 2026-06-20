from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.dependencies import get_current_active_user
from app.models.user import User, UserPreferences
from app.schemas.user import UserResponse, UserPreferencesResponse, UserPreferencesUpdate
from app.schemas.response import ResponseEnvelope
from app.core.exceptions import StockSenseException

router = APIRouter()

@router.get("/profile", response_model=ResponseEnvelope)
async def get_profile(current_user: User = Depends(get_current_active_user)):
    """Fetch the authenticated user's profile information."""
    return ResponseEnvelope(
        success=True,
        data=UserResponse.model_validate(current_user),
        message="Profile fetched successfully"
    )

@router.get("/preferences", response_model=ResponseEnvelope)
async def get_preferences(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve the current user's investment goals and notification rules."""
    result = await db.execute(select(UserPreferences).where(UserPreferences.user_id == current_user.id))
    prefs = result.scalars().first()
    
    if not prefs:
        raise StockSenseException(
            code="USER_NOT_FOUND",
            message="User preferences not initialized",
            status_code=status.HTTP_404_NOT_FOUND
        )
        
    return ResponseEnvelope(
        success=True,
        data=UserPreferencesResponse.model_validate(prefs),
        message="Preferences fetched successfully"
    )

@router.put("/preferences", response_model=ResponseEnvelope)
async def update_preferences(
    data: UserPreferencesUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user risk tolerance levels, horizons, currencies, and notifications."""
    result = await db.execute(select(UserPreferences).where(UserPreferences.user_id == current_user.id))
    prefs = result.scalars().first()
    
    if not prefs:
        raise StockSenseException(
            code="USER_NOT_FOUND",
            message="User preferences not initialized",
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    # Update fields
    for field, value in data.model_dump().items():
        setattr(prefs, field, value)
        
    await db.commit()
    await db.refresh(prefs)
    
    return ResponseEnvelope(
        success=True,
        data=UserPreferencesResponse.model_validate(prefs),
        message="Preferences updated successfully"
    )
