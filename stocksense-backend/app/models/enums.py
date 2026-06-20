import enum

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class RiskTolerance(str, enum.Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"

class InvestmentHorizon(str, enum.Enum):
    SHORT = "short"
    MEDIUM = "medium"
    LONG = "long"

class AssetType(str, enum.Enum):
    STOCK = "stock"
    ETF = "etf"
    CRYPTO = "crypto"
    BOND = "bond"
    OTHER = "other"

class TransactionType(str, enum.Enum):
    BUY = "buy"
    SELL = "sell"
    DIVIDEND = "dividend"
    SPLIT = "split"

class BacktestStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class RecommendationType(str, enum.Enum):
    REBALANCE = "rebalance"
    DIVERSIFY = "diversify"
    REDUCE_RISK = "reduce_risk"
    OPTIMIZE = "optimize"

class MarketDataType(str, enum.Enum):
    QUOTE = "quote"
    HISTORY = "history"
    INFO = "info"
