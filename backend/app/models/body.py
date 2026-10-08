from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import date as date_type

class BodyWeightLog(Base):
    __tablename__ = "body_weight_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    log_date = Column(Date, default=date_type.today)
    weight_kg = Column(Float)
    
    user = relationship("User", back_populates="body_weights")

class ProgressPhoto(Base):
    __tablename__ = "progress_photos"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    photo_date = Column(Date, default=date_type.today)
    angle = Column(String)  # front/side/back
    file_path = Column(String)
    
    user = relationship("User", back_populates="progress_photos")
