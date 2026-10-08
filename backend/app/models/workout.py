from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import date as date_type

class WorkoutPlan(Base):
    __tablename__ = "workout_plans"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    active = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="workout_plans")
    days = relationship("PlanDay", back_populates="plan", cascade="all, delete-orphan", order_by="PlanDay.order")

class PlanDay(Base):
    __tablename__ = "plan_days"
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("workout_plans.id"))
    day_of_week = Column(Integer)  # 0=Mon .. 6=Sun
    label = Column(String)  # e.g. "Push", "Chest+Triceps"
    is_rest_day = Column(Boolean, default=False)
    order = Column(Integer)
    
    plan = relationship("WorkoutPlan", back_populates="days")
    exercises = relationship("PlannedExercise", back_populates="day", cascade="all, delete-orphan", order_by="PlannedExercise.order")

class PlannedExercise(Base):
    __tablename__ = "planned_exercises"
    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("plan_days.id"))
    exercise_name = Column(String)
    body_part = Column(String)
    target_sets = Column(Integer)
    target_reps = Column(Integer, default=10)
    order = Column(Integer)
    
    day = relationship("PlanDay", back_populates="exercises")

class WorkoutLog(Base):
    __tablename__ = "workout_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan_day_id = Column(Integer, ForeignKey("plan_days.id"), nullable=True)
    log_date = Column(Date, default=date_type.today)
    notes = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    completed = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="workout_logs")
    exercises = relationship("ExerciseLog", back_populates="workout", cascade="all, delete-orphan", order_by="ExerciseLog.order")

class ExerciseLog(Base):
    __tablename__ = "exercise_logs"
    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workout_logs.id"))
    exercise_name = Column(String)
    body_part = Column(String)
    difficulty = Column(String, nullable=True)  # easy/moderate/hard/failure
    notes = Column(Text, nullable=True)
    order = Column(Integer)
    
    workout = relationship("WorkoutLog", back_populates="exercises")
    sets = relationship("SetLog", back_populates="exercise", cascade="all, delete-orphan", order_by="SetLog.set_number")

class SetLog(Base):
    __tablename__ = "set_logs"
    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercise_logs.id"))
    set_number = Column(Integer)
    reps = Column(Integer)
    weight_kg = Column(Float)
    difficulty = Column(String, nullable=True)  # easy/moderate/hard/failure
    
    exercise = relationship("ExerciseLog", back_populates="sets")
