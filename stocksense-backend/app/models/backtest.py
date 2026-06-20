from __future__ import annotations
import uuid
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import String, Numeric, ForeignKey, Enum as SQLEnum, Date, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.enums import BacktestStatus

class Backtest(Base):
    __tablename__ = "backtests"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    portfolio_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    initial_value: Mapped[Decimal] = mapped_column(Numeric(20, 6), nullable=False)
    final_value: Mapped[Decimal | None] = mapped_column(Numeric(20, 6), nullable=True)
    cagr: Mapped[Decimal | None] = mapped_column(Numeric(10, 6), nullable=True)
    sharpe_ratio: Mapped[Decimal | None] = mapped_column(Numeric(10, 6), nullable=True)
    sortino_ratio: Mapped[Decimal | None] = mapped_column(Numeric(10, 6), nullable=True)
    max_drawdown: Mapped[Decimal | None] = mapped_column(Numeric(10, 6), nullable=True)
    volatility: Mapped[Decimal | None] = mapped_column(Numeric(10, 6), nullable=True)
    calmar_ratio: Mapped[Decimal | None] = mapped_column(Numeric(10, 6), nullable=True)
    benchmark_return: Mapped[Decimal | None] = mapped_column(Numeric(10, 6), nullable=True)
    result_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    status: Mapped[BacktestStatus] = mapped_column(SQLEnum(BacktestStatus), default=BacktestStatus.PENDING, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow, 
        nullable=False
    )

    # Relationships
    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="backtests")
    user: Mapped["User"] = relationship("User", back_populates="backtests")
