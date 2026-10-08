from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class MealEntryBase(BaseModel):
    description: str
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    meal_type: str = "snack"

class MealEntryCreate(MealEntryBase):
    pass

class MealEntryResponse(MealEntryBase):
    id: int
    ai_estimated: bool = False
    class Config:
        from_attributes = True

class NutritionLogResponse(BaseModel):
    id: int
    user_id: int
    log_date: date
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    meals: List[MealEntryResponse] = []
    class Config:
        from_attributes = True

class AIFoodEstimateRequest(BaseModel):
    description: str
    meal_type: str = "snack"
    log_date: Optional[date] = None

class AIFoodEstimateResponse(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    items: list = []
    meal_entry_id: Optional[int] = None
