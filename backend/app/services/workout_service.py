from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, and_
from datetime import date, timedelta
from typing import Optional
from app.models.workout import WorkoutLog, ExerciseLog, SetLog, WorkoutPlan, PlanDay, PlannedExercise


BODY_PARTS = ["chest", "back", "legs", "shoulders", "biceps", "triceps", "core", "glutes", "forearms", "calves"]


async def get_todays_plan(user_id: int, db: AsyncSession) -> Optional[dict]:
    """Get today's planned workout from the active plan."""
    today_dow = date.today().weekday()  # 0=Mon
    result = await db.execute(
        select(WorkoutPlan)
        .options(selectinload(WorkoutPlan.days).selectinload(PlanDay.exercises))
        .where(and_(WorkoutPlan.user_id == user_id, WorkoutPlan.active == True))
    )
    plan = result.scalars().first()
    if not plan:
        return None
    for day in plan.days:
        if day.day_of_week == today_dow:
            return {
                "plan_day_id": day.id,
                "label": day.label,
                "is_rest_day": day.is_rest_day,
                "exercises": [
                    {
                        "exercise_name": ex.exercise_name,
                        "body_part": ex.body_part,
                        "target_sets": ex.target_sets,
                        "target_reps": ex.target_reps,
                    }
                    for ex in day.exercises
                ] if not day.is_rest_day else [],
            }
    return None


async def get_previous_exercise(user_id: int, exercise_name: str, db: AsyncSession) -> dict:
    """Get last session data and personal best for an exercise."""
    # Last session
    result = await db.execute(
        select(ExerciseLog)
        .join(WorkoutLog)
        .options(selectinload(ExerciseLog.sets))
        .where(and_(WorkoutLog.user_id == user_id, ExerciseLog.exercise_name == exercise_name))
        .order_by(WorkoutLog.log_date.desc())
        .limit(1)
    )
    last = result.scalars().first()

    # Personal best (heaviest weight for this exercise)
    pb_result = await db.execute(
        select(func.max(SetLog.weight_kg))
        .join(ExerciseLog)
        .join(WorkoutLog)
        .where(and_(WorkoutLog.user_id == user_id, ExerciseLog.exercise_name == exercise_name))
    )
    pb_weight = pb_result.scalar()

    return {
        "last_session": {
            "sets": [{"set_number": s.set_number, "reps": s.reps, "weight_kg": s.weight_kg, "difficulty": s.difficulty} for s in last.sets]
        } if last else None,
        "personal_best_kg": pb_weight,
    }


async def get_week_coverage(user_id: int, db: AsyncSession) -> dict:
    """Get body part coverage for the current week (Mon-Sun)."""
    today = date.today()
    monday = today - timedelta(days=today.weekday())

    # Planned sets from active plan
    plan_result = await db.execute(
        select(WorkoutPlan)
        .options(selectinload(WorkoutPlan.days).selectinload(PlanDay.exercises))
        .where(and_(WorkoutPlan.user_id == user_id, WorkoutPlan.active == True))
    )
    plan = plan_result.scalars().first()

    planned = {}
    if plan:
        for day in plan.days:
            for ex in day.exercises:
                bp = ex.body_part.lower()
                planned[bp] = planned.get(bp, 0) + ex.target_sets

    # Completed sets this week
    log_result = await db.execute(
        select(ExerciseLog)
        .join(WorkoutLog)
        .options(selectinload(ExerciseLog.sets))
        .where(and_(
            WorkoutLog.user_id == user_id,
            WorkoutLog.log_date >= monday,
            WorkoutLog.log_date <= today,
        ))
    )
    exercises = log_result.scalars().all()

    completed = {}
    for ex in exercises:
        bp = ex.body_part.lower()
        completed[bp] = completed.get(bp, 0) + len(ex.sets)

    coverage = {}
    all_parts = set(list(planned.keys()) + list(completed.keys()) + BODY_PARTS[:7])
    for bp in sorted(all_parts):
        p = planned.get(bp, 0)
        c = completed.get(bp, 0)
        if p == 0 and c == 0:
            status = "none"
        elif c >= p:
            status = "good"
        elif c >= p * 0.5:
            status = "warning"
        else:
            status = "danger"
        coverage[bp] = {"planned": p, "completed": c, "status": status}

    return coverage


async def get_streak(user_id: int, db: AsyncSession) -> int:
    """Calculate current consecutive-day workout streak."""
    result = await db.execute(
        select(WorkoutLog.log_date)
        .where(WorkoutLog.user_id == user_id)
        .order_by(WorkoutLog.log_date.desc())
        .distinct()
    )
    dates = [row[0] for row in result.all()]
    if not dates:
        return 0

    streak = 0
    expected = date.today()
    for d in dates:
        if isinstance(d, str):
            from datetime import datetime
            d = datetime.strptime(d, "%Y-%m-%d").date()
        if d == expected:
            streak += 1
            expected -= timedelta(days=1)
        elif d == expected - timedelta(days=1):
            # Allow checking from yesterday if no workout today yet
            if streak == 0:
                streak = 1
                expected = d - timedelta(days=1)
            else:
                break
        else:
            break
    return streak


async def get_recent_prs(user_id: int, db: AsyncSession, days: int = 7) -> list:
    """Find personal records set in the last N days."""
    since = date.today() - timedelta(days=days)

    result = await db.execute(
        select(ExerciseLog)
        .join(WorkoutLog)
        .options(selectinload(ExerciseLog.sets))
        .where(and_(WorkoutLog.user_id == user_id, WorkoutLog.log_date >= since))
    )
    recent_exercises = result.scalars().all()

    prs = []
    for ex in recent_exercises:
        for s in ex.sets:
            # Check if this is an all-time PR
            pb_result = await db.execute(
                select(func.max(SetLog.weight_kg))
                .join(ExerciseLog)
                .join(WorkoutLog)
                .where(and_(
                    WorkoutLog.user_id == user_id,
                    ExerciseLog.exercise_name == ex.exercise_name,
                    WorkoutLog.log_date < since,
                ))
            )
            old_pb = pb_result.scalar()
            if old_pb is not None and s.weight_kg > old_pb:
                prs.append({"exercise": ex.exercise_name, "weight_kg": s.weight_kg, "previous_kg": old_pb})
                break  # one PR per exercise is enough

    return prs
