from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from datetime import date
from app.database import get_db
from app.schemas.soreness import SorenessLogCreate, SorenessLogResponse, ReplanRequest, ReplanResponse
from app.models.soreness import SorenessLog
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services.ai_service import ai_service
from app.services.workout_service import get_todays_plan, get_week_coverage

router = APIRouter(prefix="/soreness", tags=["soreness"])

@router.post("/", response_model=SorenessLogResponse)
async def log_soreness(log: SorenessLogCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    log_date = log.log_date or date.today()
    db_log = SorenessLog(
        user_id=current_user.id, 
        log_date=log_date, 
        sore_muscles=log.sore_muscles, 
        severity=log.severity, 
        notes=log.notes
    )
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return db_log

@router.get("/", response_model=List[SorenessLogResponse])
async def get_soreness(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SorenessLog).where(SorenessLog.user_id == current_user.id).order_by(SorenessLog.log_date.desc()))
    return result.scalars().all()

@router.post("/replan", response_model=ReplanResponse)
async def replan_workout(req: ReplanRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today_plan = await get_todays_plan(current_user.id, db)
    coverage = await get_week_coverage(current_user.id, db)
    soreness_data = {"muscles": req.sore_muscles, "severity": req.severity}
    
    new_plan = await ai_service.replan_workout(soreness_data, today_plan or {}, coverage)
    return new_plan
