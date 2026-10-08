from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class PlannedExerciseBase(BaseModel):
    exercise_name: str
    body_part: str
    target_sets: int = 3
    target_reps: int = 10
    order: int = 0

class PlannedExerciseCreate(PlannedExerciseBase):
    pass

class PlannedExerciseResponse(PlannedExerciseBase):
    id: int
    class Config:
        from_attributes = True

class PlanDayBase(BaseModel):
    day_of_week: int  # 0=Mon
    label: str
    is_rest_day: bool = False
    order: int = 0

class PlanDayCreate(PlanDayBase):
    exercises: List[PlannedExerciseCreate] = []

class PlanDayResponse(PlanDayBase):
    id: int
    exercises: List[PlannedExerciseResponse] = []
    class Config:
        from_attributes = True

class WorkoutPlanBase(BaseModel):
    name: str
    active: bool = True

class WorkoutPlanCreate(WorkoutPlanBase):
    days: List[PlanDayCreate]

class WorkoutPlanResponse(WorkoutPlanBase):
    id: int
    days: List[PlanDayResponse] = []
    class Config:
        from_attributes = True

# ── Workout Logging ──

class SetLogBase(BaseModel):
    set_number: int
    reps: int
    weight_kg: float
    difficulty: Optional[str] = None  # easy/moderate/hard/failure

class SetLogCreate(SetLogBase):
    pass

class SetLogResponse(SetLogBase):
    id: int
    class Config:
        from_attributes = True

class ExerciseLogBase(BaseModel):
    exercise_name: str
    body_part: str
    difficulty: Optional[str] = None
    notes: Optional[str] = None
    order: int = 0

class ExerciseLogCreate(ExerciseLogBase):
    sets: List[SetLogCreate]

class ExerciseLogResponse(ExerciseLogBase):
    id: int
    sets: List[SetLogResponse] = []
    class Config:
        from_attributes = True

class WorkoutLogBase(BaseModel):
    log_date: date
    notes: Optional[str] = None
    duration_minutes: Optional[int] = None

class WorkoutLogCreate(WorkoutLogBase):
    plan_day_id: Optional[int] = None
    exercises: List[ExerciseLogCreate]

class WorkoutLogResponse(WorkoutLogBase):
    id: int
    completed: bool
    exercises: List[ExerciseLogResponse] = []
    class Config:
        from_attributes = True
