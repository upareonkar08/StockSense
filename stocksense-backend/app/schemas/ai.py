from pydantic import BaseModel
from uuid import UUID
from typing import Dict

class TutorRequest(BaseModel):
    query: str

class AnalystRequest(BaseModel):
    portfolio_id: UUID

class RebalanceRequest(BaseModel):
    portfolio_id: UUID
    target_weights: Dict[str, float]
