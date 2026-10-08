from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.schemas.nutrition import (
    NutritionLogResponse,
    MealEntryCreate,
    MealEntryResponse,
    AIFoodEstimateRequest,
    AIFoodEstimateResponse,
)
from app.models.nutrition import NutritionLog, MealEntry
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services.ai_service import ai_service
from app.services.nutrition_service import get_or_create_daily_log, add_meal_and_update_totals

router = APIRouter(prefix="/nutrition", tags=["nutrition"])

@router.post("/ai-estimate", response_model=AIFoodEstimateResponse)
@router.post("/estimate", response_model=AIFoodEstimateResponse)
async def estimate_food(
    req: AIFoodEstimateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    log_date = req.log_date or date.today()
    est = await ai_service.estimate_nutrition(req.description)
    
    log = await get_or_create_daily_log(current_user.id, log_date, db)
    entry = await add_meal_and_update_totals(
        log=log,
        description=req.description,
        calories=est.get("calories", 0),
        protein_g=est.get("protein_g", 0),
        carbs_g=est.get("carbs_g", 0),
        fat_g=est.get("fat_g", 0),
        meal_type=req.meal_type,
        ai_estimated=True,
        db=db
    )
    await db.commit()
    return {
        "calories": entry.calories,
        "protein_g": entry.protein_g,
        "carbs_g": entry.carbs_g,
        "fat_g": entry.fat_g,
        "items": est.get("items", []),
        "meal_entry_id": entry.id
    }

@router.post("/meal", response_model=NutritionLogResponse, status_code=status.HTTP_201_CREATED)
@router.post("/manual", response_model=NutritionLogResponse, status_code=status.HTTP_201_CREATED)
async def add_manual_meal(
    meal: MealEntryCreate,
    log_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    d = log_date or date.today()
    log = await get_or_create_daily_log(current_user.id, d, db)
    await add_meal_and_update_totals(
        log=log,
        description=meal.description,
        calories=meal.calories,
        protein_g=meal.protein_g,
        carbs_g=meal.carbs_g,
        fat_g=meal.fat_g,
        meal_type=meal.meal_type,
        ai_estimated=False,
        db=db
    )
    await db.commit()
    result = await db.execute(
        select(NutritionLog)
        .options(selectinload(NutritionLog.meals))
        .where(NutritionLog.id == log.id)
    )
    return result.scalars().first()

@router.delete("/meal/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meal(
    meal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(MealEntry)
        .join(NutritionLog)
        .where(and_(MealEntry.id == meal_id, NutritionLog.user_id == current_user.id))
    )
    entry = result.scalars().first()
    if not entry:
        raise HTTPException(status_code=404, detail="Meal not found")

    log_result = await db.execute(
        select(NutritionLog).where(NutritionLog.id == entry.nutrition_log_id)
    )
    log = log_result.scalars().first()
    if log:
        log.total_calories = max(0.0, (log.total_calories or 0.0) - (entry.calories or 0.0))
        log.total_protein_g = max(0.0, (log.total_protein_g or 0.0) - (entry.protein_g or 0.0))
        log.total_carbs_g = max(0.0, (log.total_carbs_g or 0.0) - (entry.carbs_g or 0.0))
        log.total_fat_g = max(0.0, (log.total_fat_g or 0.0) - (entry.fat_g or 0.0))

    await db.delete(entry)
    await db.commit()

@router.get("/{log_date}", response_model=NutritionLogResponse)
async def get_nutrition_by_date(
    log_date: date,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(NutritionLog)
        .options(selectinload(NutritionLog.meals))
        .where(and_(NutritionLog.user_id == current_user.id, NutritionLog.log_date == log_date))
    )
    log = result.scalars().first()
    if not log:
        return NutritionLog(
            user_id=current_user.id,
            log_date=log_date,
            total_calories=0,
            total_protein_g=0,
            total_carbs_g=0,
            total_fat_g=0,
            meals=[]
        )
    return log

@router.get("/", response_model=List[NutritionLogResponse])
async def get_all_nutrition(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(NutritionLog)
        .options(selectinload(NutritionLog.meals))
        .where(NutritionLog.user_id == current_user.id)
        .order_by(NutritionLog.log_date.desc())
    )
    return result.scalars().all()
