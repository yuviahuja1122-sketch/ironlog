from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services.analytics_service import get_dashboard_data, get_user_context
from app.services.workout_service import get_week_coverage
from app.services.ai_service import ai_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/")
async def get_dashboard(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    data = await get_dashboard_data(current_user.id, db)
    context = await get_user_context(current_user.id, db)
    try:
        motd = await ai_service.motivation_message(context)
    except Exception:
        motd = "Keep pushing! Every rep counts. 💪"
    data["message_of_the_day"] = motd
    return data

@router.get("/coverage")
async def get_coverage(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_week_coverage(current_user.id, db)

@router.get("/streaks")
async def get_streaks(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.services.workout_service import get_streak, get_recent_prs
    streak = await get_streak(current_user.id, db)
    prs = await get_recent_prs(current_user.id, db)
    return {"streak": streak, "prs": prs}
