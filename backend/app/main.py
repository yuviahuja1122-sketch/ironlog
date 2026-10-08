from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.routes import auth, profile, dashboard, workout, body, nutrition, soreness, ai
from contextlib import asynccontextmanager
import os

# Ensure uploads directory exists on import
os.makedirs("uploads", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="IronLog API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(workout.router, prefix="/api")
app.include_router(body.router, prefix="/api")
app.include_router(nutrition.router, prefix="/api")
app.include_router(soreness.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/health")
def health_check():
    return {"status": "ok"}
