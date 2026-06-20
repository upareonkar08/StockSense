import logging
from fastapi import FastAPI

from app.config import settings
from app.api.v1.router import router as api_v1_router
from app.core.exceptions import add_exception_handlers
from app.core.middleware import add_middlewares

# Initialize basic logger formatting
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# Apply global middlewares (CORS + Custom Logging headers)
add_middlewares(app)

# Apply global exception handlers
add_exception_handlers(app)

# Register all API endpoints
app.include_router(api_v1_router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
async def health_check():
    """Verify that the FastAPI backend server is alive and running."""
    return {
        "success": True,
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION
    }
