from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.schemas.ai import AIMessageCreate, AIMessageResponse
from app.models.ai import AIMessage
from app.models.user import User
from app.middleware.auth import get_current_user
from app.services.ai_service import ai_service
from app.services.analytics_service import get_user_context
from typing import List

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/chat", response_model=AIMessageResponse)
async def chat_with_coach(
    msg: AIMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_msg_user = AIMessage(user_id=current_user.id, role="user", content=msg.content)
    db.add(db_msg_user)
    
    context = await get_user_context(current_user.id, db)
    response_text = await ai_service.chat(msg.content, context)
    
    db_msg_ai = AIMessage(user_id=current_user.id, role="assistant", content=response_text)
    db.add(db_msg_ai)
    
    await db.commit()
    await db.refresh(db_msg_ai)
    return db_msg_ai

@router.get("/chat", response_model=List[AIMessageResponse])
async def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(AIMessage)
        .where(AIMessage.user_id == current_user.id)
        .order_by(AIMessage.created_at.asc())
    )
    return result.scalars().all()

@router.get("/daily-summary")
async def get_daily_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    context = await get_user_context(current_user.id, db)
    summary = await ai_service.daily_summary(context)
    return {"summary": summary}

@router.get("/weekly-summary")
async def get_weekly_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    context = await get_user_context(current_user.id, db)
    summary = await ai_service.weekly_summary(context)
    return {"summary": summary}
