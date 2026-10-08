from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    profile = relationship("Profile", back_populates="user", uselist=False)
    workout_plans = relationship("WorkoutPlan", back_populates="user")
    workout_logs = relationship("WorkoutLog", back_populates="user")
    body_weights = relationship("BodyWeightLog", back_populates="user")
    progress_photos = relationship("ProgressPhoto", back_populates="user")
    nutrition_logs = relationship("NutritionLog", back_populates="user")
    soreness_logs = relationship("SorenessLog", back_populates="user")
    ai_messages = relationship("AIMessage", back_populates="user")
