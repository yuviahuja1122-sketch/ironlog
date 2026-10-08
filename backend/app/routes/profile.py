from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.schemas.profile import ProfileCreate, ProfileResponse
from app.models.profile import Profile
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services.calorie_calc import calculate_calories

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/", response_model=ProfileResponse)
async def create_or_update_profile(profile: ProfileCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    calc = calculate_calories(profile.weight_kg, profile.height_cm, profile.age, profile.activity_level, profile.goal)
    
    result = await db.execute(select(Profile).where(Profile.user_id == current_user.id))
    db_profile = result.scalars().first()
    
    if db_profile:
        for key, value in profile.model_dump().items():
            setattr(db_profile, key, value)
        for key, value in calc.items():
            setattr(db_profile, key, value)
    else:
        db_profile = Profile(**profile.model_dump(), **calc, user_id=current_user.id)
        db.add(db_profile)
        
    await db.commit()
    await db.refresh(db_profile)
    return db_profile
