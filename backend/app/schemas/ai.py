from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AIMessageCreate(BaseModel):
    content: str

class AIMessageResponse(BaseModel):
    id: int
    user_id: int
    role: str
    content: str
    created_at: datetime
    class Config:
        from_attributes = True
