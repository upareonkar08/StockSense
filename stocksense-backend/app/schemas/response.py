from pydantic import BaseModel
from typing import Any

class ResponseEnvelope(BaseModel):
    success: bool = True
    data: Any
    message: str | None = None
    meta: dict[str, Any] | None = None
