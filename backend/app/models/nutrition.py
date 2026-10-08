from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import date as date_type

class NutritionLog(Base):
    __tablename__ = "nutrition_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    log_date = Column(Date, default=date_type.today)
    total_calories = Column(Float, default=0)
    total_protein_g = Column(Float, default=0)
    total_carbs_g = Column(Float, default=0)
    total_fat_g = Column(Float, default=0)
    
    user = relationship("User", back_populates="nutrition_logs")
    meals = relationship("MealEntry", back_populates="nutrition_log", cascade="all, delete-orphan")

class MealEntry(Base):
    __tablename__ = "meal_entries"
    id = Column(Integer, primary_key=True, index=True)
    nutrition_log_id = Column(Integer, ForeignKey("nutrition_logs.id"))
    description = Column(Text)
    calories = Column(Float, default=0)
    protein_g = Column(Float, default=0)
    carbs_g = Column(Float, default=0)
    fat_g = Column(Float, default=0)
    meal_type = Column(String, default="snack")  # breakfast/lunch/dinner/snack
    ai_estimated = Column(Boolean, default=False)
    
    nutrition_log = relationship("NutritionLog", back_populates="meals")
