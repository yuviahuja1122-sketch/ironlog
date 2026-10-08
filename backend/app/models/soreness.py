from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, JSON, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import date as date_type

class SorenessLog(Base):
    __tablename__ = "soreness_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    log_date = Column(Date, default=date_type.today)
    sore_muscles = Column(JSON)  # e.g. ["legs", "back"]
    severity = Column(Integer, default=3)  # 1-5
    notes = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="soreness_logs")
