from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from datetime import date, timedelta

from app.models.profile import Profile
from app.models.workout import WorkoutLog
from app.models.body import BodyWeightLog
from app.models.nutrition import NutritionLog
from app.services.workout_service import get_todays_plan, get_streak, get_recent_prs, get_week_coverage


async def get_user_context(user_id: int, db: AsyncSession) -> dict:
    """Build context dict to pass to AI service."""
    # Profile
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = result.scalars().first()

    # Recent weights
    weight_result = await db.execute(
        select(BodyWeightLog)
        .where(BodyWeightLog.user_id == user_id)
        .order_by(BodyWeightLog.log_date.desc())
        .limit(7)
    )
    weights = weight_result.scalars().all()

    # Today's nutrition
    today_nutr_result = await db.execute(
        select(NutritionLog)
        .where(and_(NutritionLog.user_id == user_id, NutritionLog.log_date == date.today()))
    )
    today_nutrition = today_nutr_result.scalars().first()

    # Streak and coverage
    streak = await get_streak(user_id, db)
    coverage = await get_week_coverage(user_id, db)

    context = {}
    if profile:
        context.update({
            "name": profile.name,
            "age": profile.age,
            "height_cm": profile.height_cm,
            "weight_kg": profile.weight_kg,
            "goal": profile.goal,
            "target_weight_kg": profile.target_weight_kg,
            "activity_level": profile.activity_level,
            "experience_level": profile.experience_level,
            "target_calories": profile.target_calories,
            "target_protein": profile.target_protein,
        })
    if weights:
        context["recent_weights"] = [{"date": str(w.log_date), "kg": w.weight_kg} for w in weights]
    if today_nutrition:
        context["today_nutrition"] = {
            "calories": today_nutrition.total_calories,
            "protein_g": today_nutrition.total_protein_g,
        }
    context["streak"] = streak
    context["week_coverage"] = coverage

    return context


async def get_dashboard_data(user_id: int, db: AsyncSession) -> dict:
    """Aggregate all dashboard data."""
    context = await get_user_context(user_id, db)
    today_plan = await get_todays_plan(user_id, db)
    prs = await get_recent_prs(user_id, db)

    # Latest weight + trend
    weight_result = await db.execute(
        select(BodyWeightLog)
        .where(BodyWeightLog.user_id == user_id)
        .order_by(BodyWeightLog.log_date.desc())
        .limit(14)
    )
    weights = weight_result.scalars().all()

    weight_trend = "stable"
    latest_weight = None
    if weights:
        latest_weight = weights[0].weight_kg
        if len(weights) >= 7:
            recent_avg = sum(w.weight_kg for w in weights[:7]) / 7
            older_avg = sum(w.weight_kg for w in weights[7:14]) / len(weights[7:14])
            if recent_avg < older_avg - 0.3:
                weight_trend = "down"
            elif recent_avg > older_avg + 0.3:
                weight_trend = "up"

    # Weekly workouts
    monday = date.today() - timedelta(days=date.today().weekday())
    week_result = await db.execute(
        select(WorkoutLog)
        .where(and_(WorkoutLog.user_id == user_id, WorkoutLog.log_date >= monday))
    )
    week_workouts = len(week_result.scalars().all())

    # Today's nutrition
    today_nutr = context.get("today_nutrition", {"calories": 0, "protein_g": 0})

    return {
        "today_plan": today_plan,
        "streak": context.get("streak", 0),
        "week_workouts": week_workouts,
        "prs_this_week": prs,
        "latest_weight": latest_weight,
        "weight_trend": weight_trend,
        "today_calories": today_nutr.get("calories", 0),
        "today_protein": today_nutr.get("protein_g", 0),
        "target_calories": context.get("target_calories"),
        "target_protein": context.get("target_protein"),
    }
