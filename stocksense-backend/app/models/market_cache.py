import uuid
from datetime import datetime
from sqlalchemy import String, Enum as SQLEnum, JSON, UniqueConstraint, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.models.enums import MarketDataType

class MarketCache(Base):
    __tablename__ = "market_cache"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticker: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    data_type: Mapped[MarketDataType] = mapped_column(SQLEnum(MarketDataType), nullable=False)
    interval: Mapped[str] = mapped_column(String(10), default="", nullable=False)
    period: Mapped[str] = mapped_column(String(10), default="", nullable=False)
    payload: Mapped[dict | list] = mapped_column(JSON, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # Unique constraint across ticker, type, interval, period
    __table_args__ = (
        UniqueConstraint("ticker", "data_type", "interval", "period", name="uq_market_cache"),
    )
