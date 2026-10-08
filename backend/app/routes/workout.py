from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from app.database import get_db
from app.schemas.workout import (
    WorkoutPlanCreate, WorkoutPlanResponse,
    WorkoutLogCreate, WorkoutLogResponse,
)
from app.models.workout import WorkoutPlan, PlanDay, PlannedExercise, WorkoutLog, ExerciseLog, SetLog
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services.workout_service import get_todays_plan, get_previous_exercise

router = APIRouter(prefix="/workout", tags=["workout"])

@router.post("/plans", response_model=WorkoutPlanResponse, status_code=201)
async def create_plan(plan: WorkoutPlanCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_plan = WorkoutPlan(name=plan.name, active=plan.active, user_id=current_user.id)
    db.add(db_plan)
    await db.flush()
    for day in plan.days:
        db_day = PlanDay(plan_id=db_plan.id, day_of_week=day.day_of_week, label=day.label, is_rest_day=day.is_rest_day, order=day.order)
        db.add(db_day)
        await db.flush()
        for ex in day.exercises:
            db.add(PlannedExercise(
                day_id=db_day.id, exercise_name=ex.exercise_name, body_part=ex.body_part,
                target_sets=ex.target_sets, target_reps=ex.target_reps, order=ex.order,
            ))
    await db.commit()
    result = await db.execute(
        select(WorkoutPlan)
        .options(selectinload(WorkoutPlan.days).selectinload(PlanDay.exercises))
        .where(WorkoutPlan.id == db_plan.id)
    )
    return result.scalars().first()

@router.get("/plans", response_model=List[WorkoutPlanResponse])
async def get_plans(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WorkoutPlan)
        .options(selectinload(WorkoutPlan.days).selectinload(PlanDay.exercises))
        .where(WorkoutPlan.user_id == current_user.id)
    )
    return result.scalars().all()

@router.get("/plans/{plan_id}", response_model=WorkoutPlanResponse)
async def get_plan(plan_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WorkoutPlan)
        .options(selectinload(WorkoutPlan.days).selectinload(PlanDay.exercises))
        .where(WorkoutPlan.id == plan_id, WorkoutPlan.user_id == current_user.id)
    )
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@router.delete("/plans/{plan_id}", status_code=204)
async def delete_plan(plan_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkoutPlan).where(WorkoutPlan.id == plan_id, WorkoutPlan.user_id == current_user.id))
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    await db.delete(plan)
    await db.commit()

@router.put("/plans/{plan_id}/activate")
async def activate_plan(plan_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Deactivate all
    result = await db.execute(select(WorkoutPlan).where(WorkoutPlan.user_id == current_user.id))
    for p in result.scalars().all():
        p.active = False
    # Activate chosen
    result = await db.execute(select(WorkoutPlan).where(WorkoutPlan.id == plan_id, WorkoutPlan.user_id == current_user.id))
    plan = result.scalars().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    plan.active = True
    await db.commit()
    return {"status": "ok", "active_plan_id": plan_id}

@router.get("/today")
async def get_today(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    plan = await get_todays_plan(current_user.id, db)
    if not plan:
        return {"message": "No plan for today or no active plan"}
    return plan

@router.get("/previous/{exercise_name}")
async def get_previous(exercise_name: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_previous_exercise(current_user.id, exercise_name, db)

@router.post("/logs", response_model=WorkoutLogResponse, status_code=201)
async def create_log(log: WorkoutLogCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_log = WorkoutLog(
        user_id=current_user.id, log_date=log.log_date, notes=log.notes,
        duration_minutes=log.duration_minutes, plan_day_id=log.plan_day_id,
    )
    db.add(db_log)
    await db.flush()
    for ex in log.exercises:
        db_ex = ExerciseLog(
            workout_id=db_log.id, exercise_name=ex.exercise_name, body_part=ex.body_part,
            difficulty=ex.difficulty, notes=ex.notes, order=ex.order,
        )
        db.add(db_ex)
        await db.flush()
        for s in ex.sets:
            db.add(SetLog(
                exercise_id=db_ex.id, set_number=s.set_number, reps=s.reps,
                weight_kg=s.weight_kg, difficulty=s.difficulty,
            ))
    await db.commit()
    result = await db.execute(
        select(WorkoutLog)
        .options(selectinload(WorkoutLog.exercises).selectinload(ExerciseLog.sets))
        .where(WorkoutLog.id == db_log.id)
    )
    return result.scalars().first()

@router.get("/logs", response_model=List[WorkoutLogResponse])
async def get_logs(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WorkoutLog)
        .options(selectinload(WorkoutLog.exercises).selectinload(ExerciseLog.sets))
        .where(WorkoutLog.user_id == current_user.id)
        .order_by(WorkoutLog.log_date.desc())
        .limit(50)
    )
    return result.scalars().all()

@router.get("/logs/{log_id}", response_model=WorkoutLogResponse)
async def get_log(log_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WorkoutLog)
        .options(selectinload(WorkoutLog.exercises).selectinload(ExerciseLog.sets))
        .where(WorkoutLog.id == log_id, WorkoutLog.user_id == current_user.id)
    )
    log = result.scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="Workout not found")
    return log
