from pydantic import BaseModel
from typing import Optional
from datetime import date

class BodyWeightLogCreate(BaseModel):
    weight_kg: float
    log_date: Optional[date] = None

class BodyWeightLogResponse(BaseModel):
    id: int
    user_id: int
    log_date: date
    weight_kg: float
    class Config:
        from_attributes = True

class ProgressPhotoResponse(BaseModel):
    id: int
    user_id: int
    photo_date: date
    angle: str
    file_path: str
    class Config:
        from_attributes = True
