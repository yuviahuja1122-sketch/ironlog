from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from datetime import date

from app.models.nutrition import NutritionLog, MealEntry


async def get_or_create_daily_log(user_id: int, log_date: date, db: AsyncSession) -> NutritionLog:
    """Get or create a NutritionLog for a given date."""
    result = await db.execute(
        select(NutritionLog).where(and_(
            NutritionLog.user_id == user_id,
            NutritionLog.log_date == log_date,
        ))
    )
    log = result.scalars().first()
    if not log:
        log = NutritionLog(user_id=user_id, log_date=log_date)
        db.add(log)
        await db.flush()
    return log


async def add_meal_and_update_totals(
    log: NutritionLog,
    description: str,
    calories: float,
    protein_g: float,
    carbs_g: float,
    fat_g: float,
    meal_type: str,
    ai_estimated: bool,
    db: AsyncSession,
) -> MealEntry:
    """Add a meal entry and update the daily totals."""
    entry = MealEntry(
        nutrition_log_id=log.id,
        description=description,
        calories=calories,
        protein_g=protein_g,
        carbs_g=carbs_g,
        fat_g=fat_g,
        meal_type=meal_type,
        ai_estimated=ai_estimated,
    )
    db.add(entry)

    # Recalculate totals
    log.total_calories = (log.total_calories or 0) + calories
    log.total_protein_g = (log.total_protein_g or 0) + protein_g
    log.total_carbs_g = (log.total_carbs_g or 0) + carbs_g
    log.total_fat_g = (log.total_fat_g or 0) + fat_g

    await db.flush()
    return entry
