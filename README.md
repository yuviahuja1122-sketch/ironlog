# IronLog 🏋️‍♂️🤖

> **Personal gym progress tracker with an AI coach, soreness-aware auto-programming, and natural language nutrition intelligence.**

Built with **FastAPI** (Python async backend), **SQLAlchemy** (aiosqlite / Postgres-ready), **React 18** (Vite + Tailwind CSS), and **Google Gemini API** (`gemini-3.8-flash` & `gemini-3.1-pro`).

---

## 🌟 Key Features

1. **Profile & Energy Targets**: Auto-calculates scientific BMR (Mifflin-St Jeor), TDEE, daily calorie deficit/surplus, and protein targets based on height, weight, age, activity level, and goal (Cut / Bulk / Maintain / Recomp).
2. **Weekly Split Manager**: Visual 7-day schedule (Mon–Sun) with targeted exercises, rest day toggles, and multi-plan activation.
3. **Quick-Entry Workout Logger**: 
   - Displays previous session numbers and all-time Personal Bests (PBs) per exercise.
   - 1-click **Copy Last Session** prefill.
   - Per-set weight (kg), reps, and difficulty rating (*Easy / Moderate / Hard / Failure*).
   - Milestone celebration on completion.
4. **Soreness-Aware AI Replanning**:
   - Report sore muscles anytime (*e.g. "My legs and chest are sore today"*).
   - AI coach re-engineers today's workout to bypass sore muscle groups and picks undertrained body parts based on weekly volume gaps.
   - 1-click accept or revise.
5. **Weekly Body Part Coverage Tracker**: Real-time volume dashboard (Chest, Back, Legs, Shoulders, Biceps, Triceps, Core, Glutes, Calves) with planned vs completed sets and behind-schedule warning alerts.
6. **Body Weight & Transformation Tracker**:
   - Weight tracking with an interactive Recharts line chart and 7-day moving average.
   - Progress photo upload (Front / Side / Back) and side-by-side date comparison.
7. **AI Natural Language Nutrition Tracker**:
   - Type meals freely (*e.g. "3 rotis, dal, 200g paneer, and a banana"*).
   - AI estimates calories, protein, carbs, and fat (with excellent Indian & global food support).
   - Gentle, non-shaming coaching advice when exceeding daily calorie targets.
8. **Interactive AI Coach**:
   - Conversational fitness advisor with full context of your profile, workout logs, weight trends, and soreness data.
   - Celebrates PRs, streaks, and progressive overload; gives honest, constructive feedback for plateaus without generic fluff.
   - Quick one-click actions: *Daily Summary*, *Weekly Review*, *Rate My Progress*.
9. **PWA-Ready & Mobile First**: Fast, dark-mode native feel on gym phones with bottom navigation.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Axios, `@tanstack/react-query`, `vite-plugin-pwa`.
- **Backend**: Python 3.9+, FastAPI, SQLAlchemy (async with `aiosqlite`), Pydantic v2, `PyJWT`, `bcrypt`.
- **AI Engine**: Google Gemini API via `google-genai` SDK:
  - `GEMINI_FAST_MODEL`: `gemini-3.8-flash` (for instant nutrition parsing, MOTD, quick advice).
  - `GEMINI_COACH_MODEL`: `gemini-3.1-pro` (for deep workout replanning and coach dialogue).
  - Automatic fallback to the fast model if rate limits or network issues occur.
  - Offline `MockProvider` included if running without an API key.

---

## 🚀 Quickstart & Run Instructions

### 1. Backend Setup

```bash
cd backend

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Optional: Add your GEMINI_API_KEY in .env

# Seed database with 3 weeks of realistic demo data
python app/seed.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

FastAPI server runs at `http://localhost:8000`.  
Swagger interactive API docs available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 3. Demo Credentials

The database seed script creates a complete test account with 3 weeks of workout logs, weight logs, and nutrition:

- **Email**: `test@ironlog.app`
- **Password**: `test1234`
- Or click the **"Load Demo"** button on the sign-in screen!

---

## 🧪 Running Backend Tests

```bash
cd backend
PYTHONPATH=. ./venv/bin/pytest tests/
```

Includes unit tests for:
- BMR / TDEE / goal calorie & protein formulas (Cut, Bulk, Maintain, Recomp).
- AI replanning, nutrition estimation, and coach chat fallback logic.

---

## 📂 Project Structure

```
ironlog/
├── backend/
│   ├── app/
│   │   ├── config.py             # Pydantic Settings (.env loader)
│   │   ├── database.py           # Async SQLAlchemy engine & session
│   │   ├── main.py               # FastAPI app, CORS, static uploads
│   │   ├── seed.py               # Realistic 3-week seed script
│   │   ├── middleware/
│   │   │   └── auth.py           # JWT Bearer authentication
│   │   ├── models/               # SQLAlchemy DB Models (User, Profile, Workout, etc.)
│   │   ├── routes/               # API endpoints (/auth, /dashboard, /workout, etc.)
│   │   ├── schemas/              # Pydantic validation schemas
│   │   └── services/             # Swappable AI, Workout, Nutrition & Analytics services
│   ├── tests/                    # Pytest test suite
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios API client & domain endpoints
│   │   ├── components/           # UI Components (Button, Card, Input, Modal, Badge, Nav)
│   │   ├── context/              # AuthContext (JWT session management)
│   │   └── pages/                # 9 full application pages
│   ├── public/manifest.json      # PWA Web Manifest
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── README.md
└── .env.example
```
