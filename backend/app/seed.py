import asyncio
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.database import Base
from app.config import settings
from app.models.user import User
from app.models.profile import Profile
from app.models.workout import WorkoutPlan, PlanDay, PlannedExercise, WorkoutLog, ExerciseLog, SetLog
from app.models.body import BodyWeightLog, ProgressPhoto
from app.models.nutrition import NutritionLog, MealEntry
from app.models.soreness import SorenessLog
from app.models.ai import AIMessage
from app.services.auth import get_password_hash
from app.services.calorie_calc import calculate_calories

async def seed():
    print("🌱 Seeding IronLog database...")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    async with AsyncSessionLocal() as session:
        # 1. User
        hashed_pwd = get_password_hash("test1234")
        user = User(email="test@ironlog.app", hashed_password=hashed_pwd)
        session.add(user)
        await session.flush()
        print(f"Created user: {user.email} (id: {user.id})")
        
        # 2. Profile
        calc = calculate_calories(weight_kg=78.0, height_cm=175.0, age=25, activity_level="moderate", goal="cut")
        profile = Profile(
            user_id=user.id,
            name="Yuvi",
            age=25,
            height_cm=175.0,
            weight_kg=78.0,
            goal="cut",
            target_weight_kg=72.0,
            activity_level="moderate",
            experience_level="intermediate",
            **calc
        )
        session.add(profile)
        
        # 3. Active Weekly Workout Plan (Mon=0 to Sun=6)
        plan = WorkoutPlan(user_id=user.id, name="Push Pull Legs Split (6-Day)", active=True)
        session.add(plan)
        await session.flush()
        
        days_config = [
            (0, "Push (Chest/Shoulders/Triceps)", False, [
                ("Barbell Bench Press", "chest", 4, 8),
                ("Incline Dumbbell Press", "chest", 3, 10),
                ("Dumbbell Overhead Press", "shoulders", 3, 10),
                ("Cable Lateral Raise", "shoulders", 4, 15),
                ("Tricep Rope Pushdown", "triceps", 3, 12),
                ("Overhead Tricep Extension", "triceps", 3, 12),
            ]),
            (1, "Pull (Back/Biceps/Rear Delts)", False, [
                ("Barbell Deadlift", "back", 3, 6),
                ("Lat Pulldown", "back", 4, 10),
                ("Seated Cable Row", "back", 3, 12),
                ("Face Pulls", "shoulders", 4, 15),
                ("Incline Dumbbell Curl", "biceps", 3, 12),
                ("Hammer Curls", "biceps", 3, 12),
            ]),
            (2, "Legs & Core", False, [
                ("Barbell Back Squat", "legs", 4, 8),
                ("Romanian Deadlift", "legs", 3, 10),
                ("Leg Press", "legs", 3, 12),
                ("Standing Calf Raise", "calves", 4, 15),
                ("Hanging Leg Raise", "core", 3, 15),
                ("Plank", "core", 3, 60),
            ]),
            (3, "Push & Shoulders Focus", False, [
                ("Incline Barbell Bench", "chest", 4, 8),
                ("Dumbbell Flat Bench", "chest", 3, 10),
                ("Standing Military Press", "shoulders", 4, 8),
                ("Lateral Raises", "shoulders", 4, 15),
                ("Skull Crushers", "triceps", 3, 12),
            ]),
            (4, "Pull & Arms Focus", False, [
                ("Pull-ups (Weighted)", "back", 4, 8),
                ("Chest-Supported T-Bar Row", "back", 4, 10),
                ("Barbell Shrugs", "back", 3, 12),
                ("Barbell Bicep Curl", "biceps", 4, 10),
                ("Preacher Curl", "biceps", 3, 12),
                ("Dips (Weighted)", "triceps", 3, 10),
            ]),
            (5, "Legs & Calves Hypertrophy", False, [
                ("Front Squat", "legs", 4, 8),
                ("Bulgarian Split Squat", "legs", 3, 10),
                ("Lying Hamstring Curl", "legs", 4, 12),
                ("Leg Extensions", "legs", 3, 15),
                ("Seated Calf Raise", "calves", 4, 15),
                ("Cable Woodchoppers", "core", 3, 15),
            ]),
            (6, "Rest & Active Recovery", True, []),
        ]
        
        for dow, label, is_rest, exercises in days_config:
            pday = PlanDay(plan_id=plan.id, day_of_week=dow, label=label, is_rest_day=is_rest, order=dow)
            session.add(pday)
            await session.flush()
            for idx, (ename, bpart, sets, reps) in enumerate(exercises):
                session.add(PlannedExercise(
                    day_id=pday.id,
                    exercise_name=ename,
                    body_part=bpart,
                    target_sets=sets,
                    target_reps=reps,
                    order=idx + 1
                ))

        # 4. Past 3 Weeks of Workout Logs with Progressive Overload
        today = date.today()
        workout_templates = [
            ("Push Day", [
                ("Barbell Bench Press", "chest", [(8, 70.0, "moderate"), (8, 75.0, "moderate"), (8, 80.0, "hard"), (6, 82.5, "failure")]),
                ("Incline Dumbbell Press", "chest", [(10, 26.0, "moderate"), (10, 28.0, "hard"), (8, 30.0, "failure")]),
                ("Cable Lateral Raise", "shoulders", [(15, 10.0, "easy"), (15, 12.5, "moderate"), (12, 12.5, "hard")]),
                ("Tricep Rope Pushdown", "triceps", [(12, 25.0, "moderate"), (12, 27.5, "moderate"), (10, 30.0, "hard")]),
            ]),
            ("Pull Day", [
                ("Barbell Deadlift", "back", [(6, 120.0, "moderate"), (6, 130.0, "hard"), (5, 140.0, "hard")]),
                ("Lat Pulldown", "back", [(10, 60.0, "moderate"), (10, 65.0, "moderate"), (8, 70.0, "hard")]),
                ("Face Pulls", "shoulders", [(15, 20.0, "easy"), (15, 22.5, "moderate"), (15, 25.0, "moderate")]),
                ("Incline Dumbbell Curl", "biceps", [(12, 14.0, "moderate"), (10, 16.0, "hard"), (8, 16.0, "failure")]),
            ]),
            ("Leg Day", [
                ("Barbell Back Squat", "legs", [(8, 90.0, "moderate"), (8, 100.0, "hard"), (6, 105.0, "hard"), (6, 110.0, "failure")]),
                ("Romanian Deadlift", "legs", [(10, 80.0, "moderate"), (10, 85.0, "hard"), (8, 90.0, "hard")]),
                ("Leg Press", "legs", [(12, 160.0, "moderate"), (12, 180.0, "hard"), (10, 200.0, "hard")]),
                ("Standing Calf Raise", "calves", [(15, 50.0, "moderate"), (15, 55.0, "moderate"), (15, 60.0, "hard")]),
            ]),
        ]

        for day_offset in range(21, 0, -1):
            log_d = today - timedelta(days=day_offset)
            dow = log_d.weekday()
            if dow == 6:  # Sunday rest
                continue
            
            tmpl_idx = dow % 3
            wname, exercises = workout_templates[tmpl_idx]
            
            wlog = WorkoutLog(
                user_id=user.id,
                log_date=log_d,
                notes=f"Solid {wname} session. Good energy and focus.",
                duration_minutes=55 + (day_offset % 15),
                completed=True
            )
            session.add(wlog)
            await session.flush()
            
            # Add progressive overload: slight weight increment for more recent logs
            progression = (21 - day_offset) * 0.25
            
            for ex_idx, (ename, bpart, sets) in enumerate(exercises):
                elog = ExerciseLog(
                    workout_id=wlog.id,
                    exercise_name=ename,
                    body_part=bpart,
                    difficulty="moderate",
                    order=ex_idx + 1
                )
                session.add(elog)
                await session.flush()
                
                for s_num, (reps, base_wt, diff) in enumerate(sets):
                    session.add(SetLog(
                        exercise_id=elog.id,
                        set_number=s_num + 1,
                        reps=reps,
                        weight_kg=round(base_wt + progression, 1),
                        difficulty=diff
                    ))

        # 5. Body Weight Tracking (Past 28 Days, trending 78.6 down to 75.8)
        base_weight = 78.6
        for d_offset in range(28, -1, -1):
            w_date = today - timedelta(days=d_offset)
            # gradual decrease with small day-to-day noise
            loss = (28 - d_offset) * 0.095
            noise = ((d_offset * 7) % 5 - 2) * 0.08
            cur_w = round(base_weight - loss + noise, 1)
            session.add(BodyWeightLog(user_id=user.id, log_date=w_date, weight_kg=cur_w))

        # 6. Nutrition Logs (Past 14 Days)
        indian_meals_db = [
            ("3 rotis + 1 bowl yellow dal + 150g grilled paneer", 620, 36, 68, 22, "lunch"),
            ("Oats with scoop of whey protein, almonds and 1 banana", 480, 34, 62, 10, "breakfast"),
            ("200g chicken breast curry with 1 cup steamed basmati rice", 580, 48, 55, 14, "dinner"),
            ("Greek yogurt with berries & 1 boiled egg", 220, 18, 16, 6, "snack"),
            ("4 scrambled egg whites + 2 whole eggs with brown toast", 410, 32, 28, 18, "breakfast"),
            ("Paneer bhurji (200g) with 2 whole wheat rotis & salad", 550, 38, 42, 25, "dinner"),
        ]

        for d_offset in range(14, -1, -1):
            n_date = today - timedelta(days=d_offset)
            n_log = NutritionLog(
                user_id=user.id,
                log_date=n_date,
                total_calories=0,
                total_protein_g=0,
                total_carbs_g=0,
                total_fat_g=0
            )
            session.add(n_log)
            await session.flush()
            
            # Add 3 meals for this day
            meal_indices = [(d_offset) % len(indian_meals_db), (d_offset + 1) % len(indian_meals_db), (d_offset + 3) % len(indian_meals_db)]
            for m_idx in meal_indices:
                desc, cals, prot, carbs, fat, mtype = indian_meals_db[m_idx]
                session.add(MealEntry(
                    nutrition_log_id=n_log.id,
                    description=desc,
                    calories=cals,
                    protein_g=prot,
                    carbs_g=carbs,
                    fat_g=fat,
                    meal_type=mtype,
                    ai_estimated=True
                ))
                n_log.total_calories += cals
                n_log.total_protein_g += prot
                n_log.total_carbs_g += carbs
                n_log.total_fat_g += fat

        # 7. Soreness Logs
        session.add(SorenessLog(
            user_id=user.id,
            log_date=today - timedelta(days=2),
            sore_muscles=["legs", "glutes"],
            severity=4,
            notes="Heavy squats two days ago left quads feeling stiff."
        ))
        session.add(SorenessLog(
            user_id=user.id,
            log_date=today,
            sore_muscles=["chest"],
            severity=3,
            notes="Upper chest is tight from yesterday's incline presses."
        ))

        # 8. AI Messages (Realistic coaching dialogue)
        chat_history = [
            that biofeedback. We'll swap today's push work for an active recovery session focusing on core and shoulders/rear delts. I've rebalanced your weekly schedule so your chest hits its volume target later in the week once fully recovered!"),
        ]
        
        for role, content in chat_history:
            session.add(AIMessage(
                user_id=user.id,
                role=role,
                content=content,
                created_at=datetime.utcnow() - timedelta(hours=len(chat_history) - chat_history.index((role, content)))
            ))

        await session.commit()
        print("✅ Database successfully seeded with 3 weeks of realistic data!")

if __name__ == "__main__":
    asyncio.run(seed())
