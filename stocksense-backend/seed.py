import asyncio
import logging
from datetime import datetime, timezone
from decimal import Decimal

from app.db.session import async_session_maker, engine
from app.db.base import Base
from app.models.user import User, UserPreferences
from app.models.enums import TransactionType
from app.core.security import hash_password
from app.schemas.portfolio import PortfolioCreate
from app.schemas.transaction import TransactionCreate
import app.services.portfolio_service as portfolio_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.seed")

async def seed_data():
    logger.info("Starting database seeding...")
    
    # Check/Create tables locally if not already exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with async_session_maker() as db:
        # Check if seed user already exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == "test@stocksense.com"))
        user = result.scalars().first()
        
        if user:
            logger.info("Seed user test@stocksense.com already exists. Skipping seed.")
            return

        logger.info("Creating seed user test@stocksense.com...")
        hashed_pwd = hash_password("Password123")
        user = User(
            email="test@stocksense.com",
            hashed_password=hashed_pwd,
            full_name="John Doe"
        )
        db.add(user)
        await db.flush() # get user.id
        
        # Create user preferences
        logger.info("Creating user preferences...")
        prefs = UserPreferences(user_id=user.id)
        db.add(prefs)
        await db.commit()
        await db.refresh(user)

        # Create sample portfolio
        logger.info("Creating sample portfolio 'Retirement Portfolio'...")
        portfolio = await portfolio_service.create_portfolio(
            db, 
            user.id, 
            PortfolioCreate(
                name="Retirement Portfolio", 
                description="Long term buy and hold portfolio.",
                currency="USD",
                is_default=True
            )
        )
        
        # Log transactions
        txs = [
            TransactionCreate(
                ticker="AAPL",
                type=TransactionType.BUY,
                quantity=Decimal("50.0"),
                price=Decimal("150.0"),
                fee=Decimal("1.50"),
                notes="Initial buy AAPL",
                executed_at=datetime(2025, 6, 12, 10, 0, tzinfo=timezone.utc)
            ),
            TransactionCreate(
                ticker="GOOGL",
                type=TransactionType.BUY,
                quantity=Decimal("100.0"),
                price=Decimal("120.0"),
                fee=Decimal("2.0"),
                notes="Initial buy GOOGL",
                executed_at=datetime(2025, 7, 10, 10, 0, tzinfo=timezone.utc)
            ),
            TransactionCreate(
                ticker="MSFT",
                type=TransactionType.BUY,
                quantity=Decimal("40.0"),
                price=Decimal("300.0"),
                fee=Decimal("1.0"),
                notes="Initial buy MSFT",
                executed_at=datetime(2025, 8, 5, 10, 0, tzinfo=timezone.utc)
            ),
            TransactionCreate(
                ticker="AAPL",
                type=TransactionType.SELL,
                quantity=Decimal("10.0"),
                price=Decimal("175.0"),
                fee=Decimal("1.50"),
                notes="Partial profit taking AAPL",
                executed_at=datetime(2025, 11, 20, 15, 0, tzinfo=timezone.utc)
            )
        ]
        
        logger.info("Logging seed transactions...")
        for tx in txs:
            await portfolio_service.add_transaction(db, portfolio.id, user.id, tx)
            
        logger.info("Seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
