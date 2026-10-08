from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class SorenessLogCreate(BaseModel):
    sore_muscles: List[str]
    severity: int = 3
    notes: Optional[str] = None
    log_date: Optional[date] = None

class SorenessLogResponse(BaseModel):
    id: int
    user_id: int
    log_date: date
    sore_muscles: list
    severity: int
    notes: Optional[str]
    class Config:
        from_attributes = True

class ReplanRequest(BaseModel):
    sore_muscles: List[str]
    severity: int = 3

class ReplanResponse(BaseModel):
    reason: str
    skipped_muscles: list = []
    exercises: list = []
