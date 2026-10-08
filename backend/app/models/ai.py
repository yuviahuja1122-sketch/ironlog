from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class AIMessage(Base):
    __tablename__ = "ai_messages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    role = Column(String)  # user/assistant/system
    content = Column(Text)
    metadata_json = Column(JSON, nullable=True)
    
    user = relationship("User", back_populates="ai_messages")
