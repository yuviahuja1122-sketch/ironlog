from pydantic import BaseModel
from typing import Optional

class ProfileBase(BaseModel):
    name: str
    age: int
    height_cm: float
    weight_kg: float
    goal: str
    target_weight_kg: float
    activity_level: str
    experience_level: str

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    bmr: float
    tdee: float
    target_calories: float
    target_protein: float
    
    class Config:
        from_attributes = True
