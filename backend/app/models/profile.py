from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    age = Column(Integer)
    height_cm = Column(Float)
    weight_kg = Column(Float)
    goal = Column(String)
    target_weight_kg = Column(Float)
    activity_level = Column(String)
    experience_level = Column(String)

    bmr = Column(Float)
    tdee = Column(Float)
    target_calories = Column(Float)
    target_protein = Column(Float)
    
    user = relationship("User", back_populates="profile")
