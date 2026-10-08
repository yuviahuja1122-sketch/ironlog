from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import date
import os, uuid

from app.database import get_db
from app.schemas.body import BodyWeightLogCreate, BodyWeightLogResponse, ProgressPhotoResponse
from app.models.body import BodyWeightLog, ProgressPhoto
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/body", tags=["body"])

@router.post("/weight", response_model=BodyWeightLogResponse)
async def log_weight(log: BodyWeightLogCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if log.log_date is None:
        log.log_date = date.today()
    db_log = BodyWeightLog(user_id=current_user.id, log_date=log.log_date, weight_kg=log.weight_kg)
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return db_log

@router.get("/weight", response_model=List[BodyWeightLogResponse])
async def get_weight(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BodyWeightLog).where(BodyWeightLog.user_id == current_user.id).order_by(BodyWeightLog.log_date.desc()))
    return result.scalars().all()

@router.post("/photo", response_model=ProgressPhotoResponse)
async def upload_photo(
    angle: str = Form(...),
    photo_date: Optional[date] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = f"uploads/{filename}"
    with open(filepath, "wb") as f:
        f.write(await file.read())
        
    db_photo = ProgressPhoto(
        user_id=current_user.id,
        photo_date=photo_date or date.today(),
        angle=angle,
        file_path=f"/uploads/{filename}"
    )
    db.add(db_photo)
    await db.commit()
    await db.refresh(db_photo)
    return db_photo

@router.get("/photo", response_model=List[ProgressPhotoResponse])
async def get_photos(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProgressPhoto).where(ProgressPhoto.user_id == current_user.id).order_by(ProgressPhoto.photo_date.desc()))
    return result.scalars().all()
