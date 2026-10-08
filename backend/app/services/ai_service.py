import json
import logging
from abc import ABC, abstractmethod
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


class AIProvider(ABC):
    """Abstract AI provider — swap implementations to change the underlying model."""

    @abstractmethod
    async def generate(self, prompt: str, system_prompt: str, model_type: str = "fast") -> str:
        """Generate text. model_type is 'fast' or 'coach'."""
        ...


class GeminiProvider(AIProvider):
    """Google Gemini implementation with automatic fallback."""

    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            from google import genai
            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return self._client

    def _get_model(self, model_type: str) -> str:
        if model_type == "coach":
            return settings.GEMINI_COACH_MODEL
        return settings.GEMINI_FAST_MODEL

    async def generate(self, prompt: str, system_prompt: str, model_type: str = "fast") -> str:
        from google.genai import types

        model = self._get_model(model_type)
        try:
            response = self.client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.7,
                ),
            )
            return response.text or ""
        except Exception as exc:
            logger.warning("Gemini %s (%s) failed: %s", model_type, model, exc)
            # Fallback: coach → fast
            if model_type == "coach":
                logger.info("Falling back to fast model %s", settings.GEMINI_FAST_MODEL)
                try:
                    response = self.client.models.generate_content(
                        model=settings.GEMINI_FAST_MODEL,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_prompt,
                            temperature=0.7,
                        ),
                    )
                    return response.text or ""
                except Exception as fallback_exc:
                    logger.error("Fallback also failed: %s", fallback_exc)
            raise


class MockProvider(AIProvider):
    """Offline mock for dev/testing when no API key is set."""

    async def generate(self, prompt: str, system_prompt: str, model_type: str = "fast") -> str:
        sys_lower = system_prompt.lower()
        prompt_lower = prompt.lower()

        # Nutrition estimation specifically requests JSON with calories/protein_g schema
        if "nutrition expert" in sys_lower or "estimate the macros" in sys_lower:
            # Smart baseline dictionary for offline mode
            food_db = {
                "banana": {"cals": 105, "p": 1.3, "c": 27.0, "f": 0.3},
                "apple": {"cals": 95, "p": 0.5, "c": 25.0, "f": 0.3},
                "roti": {"cals": 100, "p": 3.0, "c": 20.0, "f": 1.0},
                "chapati": {"cals": 100, "p": 3.0, "c": 20.0, "f": 1.0},
                "dal": {"cals": 150, "p": 9.0, "c": 22.0, "f": 3.0},
                "paneer": {"cals": 260, "p": 18.0, "c": 4.0, "f": 20.0},
                "chicken": {"cals": 220, "p": 31.0, "c": 0.0, "f": 4.5},
                "egg": {"cals": 75, "p": 6.5, "c": 0.5, "f": 5.0},
                "eggs": {"cals": 150, "p": 13.0, "c": 1.0, "f": 10.0},
                "rice": {"cals": 200, "p": 4.0, "c": 45.0, "f": 0.5},
                "oats": {"cals": 180, "p": 6.0, "c": 32.0, "f": 3.0},
                "milk": {"cals": 150, "p": 8.0, "c": 12.0, "f": 8.0},
                "whey": {"cals": 120, "p": 24.0, "c": 3.0, "f": 1.5},
                "protein shake": {"cals": 140, "p": 25.0, "c": 4.0, "f": 2.0},
                "curd": {"cals": 120, "p": 6.0, "c": 8.0, "f": 5.0},
                "yogurt": {"cals": 120, "p": 6.0, "c": 8.0, "f": 5.0},
                "dosa": {"cals": 170, "p": 4.0, "c": 30.0, "f": 4.0},
                "idli": {"cals": 65, "p": 2.0, "c": 14.0, "f": 0.2},
                "toast": {"cals": 80, "p": 3.0, "c": 15.0, "f": 1.0},
                "coffee": {"cals": 30, "p": 1.0, "c": 3.0, "f": 1.0},
            }

            matched = []
            total_cals = 0.0
            total_p = 0.0
            total_c = 0.0
            total_f = 0.0

            for key, val in food_db.items():
                if key in prompt_lower:
                    # Detect multiplier like '2 eggs' or '3 rotis' or '200g'
                    mult = 1.0
                    import re
                    match = re.search(rf'(\d+)\s*(?:g|grams|pieces|x)?\s*{key}', prompt_lower)
                    if match:
                        num = float(match.group(1))
                        if "g" in match.group(0) or "gram" in match.group(0):
                            mult = num / 100.0
                        else:
                            mult = num
                    elif re.search(rf'{key}\s*\(?(\d+)\s*g\)?', prompt_lower):
                        g_match = re.search(rf'{key}\s*\(?(\d+)\s*g\)?', prompt_lower)
                        mult = float(g_match.group(1)) / 100.0

                    item_cals = round(val["cals"] * mult, 1)
                    item_p = round(val["p"] * mult, 1)
                    item_c = round(val["c"] * mult, 1)
                    item_f = round(val["f"] * mult, 1)

                    total_cals += item_cals
                    total_p += item_p
                    total_c += item_c
                    total_f += item_f

                    matched.append({
                        "name": f"{key} ({mult:g}x)",
                        "calories": item_cals,
                        "protein_g": item_p,
                        "carbs_g": item_c,
                        "fat_g": item_f
                    })

            if not matched:
                # Default generic estimate if food not in offline list
                total_cals = 250.0
                total_p = 15.0
                total_c = 30.0
                total_f = 8.0
                matched.append({
                    "name": prompt[:40],
                    "calories": total_cals,
                    "protein_g": total_p,
                    "carbs_g": total_c,
                    "fat_g": total_f
                })

            return json.dumps({
                "calories": round(total_cals, 1),
                "protein_g": round(total_p, 1),
                "carbs_g": round(total_c, 1),
                "fat_g": round(total_f, 1),
                "items": matched
            })

        # Replan workout
        if "rebuild today's workout" in sys_lower or "replan" in sys_lower:
            return json.dumps({
                "reason": "Bypassing reported sore muscles. Shifting volume to undertrained shoulders and core to balance your weekly hypertrophy target.",
                "skipped_muscles": ["chest", "legs"],
                "exercises": [
                    {"exercise_name": "Overhead Barbell Press", "body_part": "shoulders", "sets": 4, "reps": 8},
                    {"exercise_name": "Dumbbell Lateral Raise", "body_part": "shoulders", "sets": 4, "reps": 15},
                    {"exercise_name": "Face Pulls", "body_part": "shoulders", "sets": 3, "reps": 15},
                    {"exercise_name": "Hanging Leg Raise", "body_part": "core", "sets": 3, "reps": 15},
                    {"exercise_name": "Ab Wheel Rollout", "body_part": "core", "sets": 3, "reps": 12},
                ]
            })

        # Daily summary
        if "daily summary" in prompt_lower:
            return "📊 **Daily Summary**: Solid consistency today! You've logged your training, your weight is trending down toward your 72kg goal, and your protein intake is in a great spot. Tomorrow is leg day — focus on depth on squats and stay hydrated! 💪"

        # Weekly summary
        if "weekly review" in prompt_lower or "weekly summary" in prompt_lower:
            return "📅 **Weekly Coach Review**:\n- **Consistency**: 5 sessions logged this week. Excellent dedication.\n- **PRs**: Bench Press (82.5kg × 6) and Squat (110kg × 6).\n- **Volume**: Shoulders and Back on track; add 2 more sets of core.\n- **Weight Trend**: Down 0.4kg this week, perfectly in line with a 500 kcal cut.\nKeep up the phenomenal discipline!"

        # Motivational message of the day
        if "motivational message" in prompt_lower:
            return "Consistency is the compound interest of self-improvement. Your progressive overload numbers show you're gaining strength even on a cut — keep that fire burning today! 🔥"

        # General Coach Chat
        if "strength" in prompt_lower:
            return "Your strength numbers are progressing remarkably well! You've added weight to both your bench press and squat over the last 3 weeks. As long as you keep protein around 170g and sleep 7-8 hours, you'll retain your hard-earned muscle throughout this cut. 🎯"

        return "Great effort! Consistency and progressive overload are your superpowers. What area do you want to focus on for your next workout? 💪"


def _parse_json_response(text: str) -> dict:
    """Extract JSON from an LLM response that might include markdown fences."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = lines[1:]  # remove opening fence
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {}


class AIService:
    """High-level AI operations. All AI features go through this class."""

    def __init__(self, provider: AIProvider):
        self.provider = provider

    # ── Chat ──────────────────────────────────────────────────────
    async def chat(self, message: str, context: dict) -> str:
        system_prompt = self._build_coach_system_prompt(context)
        return await self.provider.generate(message, system_prompt, "coach")

    # ── Nutrition estimation ──────────────────────────────────────
    async def estimate_nutrition(self, food_description: str, user_context: Optional[dict] = None) -> dict:
        system_prompt = (
            "You are a nutrition expert. The user describes food they ate. "
            "Estimate the macros. Support Indian foods well (roti, dal, paneer, rice, etc). "
            "Return ONLY valid JSON with this exact schema, no extra text:\n"
            '{"calories": <number>, "protein_g": <number>, "carbs_g": <number>, "fat_g": <number>, '
            '"items": [{"name": "<item>", "calories": <n>, "protein_g": <n>, "carbs_g": <n>, "fat_g": <n>}]}'
        )
        result = await self.provider.generate(food_description, system_prompt, "fast")
        parsed = _parse_json_response(result)
        if not parsed or "calories" not in parsed:
            return {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "items": [], "raw": result}
        return parsed

    # ── Soreness-aware replanning ─────────────────────────────────
    async def replan_workout(self, soreness_data: dict, current_plan: dict, week_coverage: dict) -> dict:
        system_prompt = (
            "You are an expert strength coach. The user reports muscle soreness. "
            "Your job is to rebuild today's workout:\n"
            "1. Skip the sore muscle groups entirely\n"
            "2. Pick body parts the user hasn't trained enough this week (look at the coverage data)\n"
            "3. Suggest 4-6 exercises for the replacement workout\n"
            "4. Return ONLY valid JSON:\n"
            '{"reason": "<why you chose this>", "skipped_muscles": ["<muscle>"], '
            '"exercises": [{"exercise_name": "<name>", "body_part": "<part>", "sets": <n>, "reps": <n>}]}'
        )
        prompt = (
            f"My sore muscles: {json.dumps(soreness_data)}\n"
            f"Today's planned workout: {json.dumps(current_plan)}\n"
            f"This week's body part coverage (sets done): {json.dumps(week_coverage)}"
        )
        result = await self.provider.generate(prompt, system_prompt, "coach")
        parsed = _parse_json_response(result)
        if not parsed or "exercises" not in parsed:
            return {"reason": "Could not generate plan", "exercises": [], "raw": result}
        return parsed

    # ── Daily summary ─────────────────────────────────────────────
    async def daily_summary(self, context: dict) -> str:
        system_prompt = self._build_coach_system_prompt(context)
        prompt = (
            "Give me a brief daily summary. Cover: "
            "1) How today's workout went (if done) "
            "2) Nutrition progress vs targets "
            "3) Any PRs or notable achievements "
            "4) One specific tip for tomorrow. "
            "Keep it warm, motivating, and under 150 words."
        )
        return await self.provider.generate(prompt, system_prompt, "coach")

    # ── Weekly summary ────────────────────────────────────────────
    async def weekly_summary(self, context: dict) -> str:
        system_prompt = self._build_coach_system_prompt(context)
        prompt = (
            "Give me a weekly review. Cover: "
            "1) Workout consistency (days hit vs planned) "
            "2) Body part coverage gaps "
            "3) Strength progression trends "
            "4) Weight trend vs goal "
            "5) Nutrition adherence "
            "6) Top 3 wins this week "
            "7) Top 2 areas to improve next week. "
            "Be honest but kind. Under 250 words."
        )
        return await self.provider.generate(prompt, system_prompt, "coach")

    # ── Motivation MOTD ───────────────────────────────────────────
    async def motivation_message(self, context: dict) -> str:
        system_prompt = self._build_coach_system_prompt(context)
        prompt = (
            "Give me a short, personalized motivational message for today. "
            "Reference something specific from my recent data — a PR, a streak, weight progress, etc. "
            "Make it warm and genuine, not generic. 1-2 sentences max."
        )
        return await self.provider.generate(prompt, system_prompt, "fast")

    # ── Nutrition advice ──────────────────────────────────────────
    async def nutrition_advice(self, context: dict, today_nutrition: dict) -> str:
        system_prompt = self._build_coach_system_prompt(context)
        prompt = (
            f"Today's nutrition so far: {json.dumps(today_nutrition)}. "
            f"My daily targets: calories={context.get('target_calories', 'unknown')}, "
            f"protein={context.get('target_protein', 'unknown')}g. "
            "If I'm over my target, give a gentle, non-shaming suggestion for how to balance "
            "the rest of the day or tomorrow. If I'm under, encourage me. Be specific and practical. "
            "2-3 sentences max."
        )
        return await self.provider.generate(prompt, system_prompt, "fast")

    # ── Build system prompt with user context ─────────────────────
    def _build_coach_system_prompt(self, context: dict) -> str:
        base = (
            "You are IronLog AI Coach — a warm, positive, motivating personal fitness coach. "
            "You celebrate wins (PRs, consistency streaks, progress toward goals). "
            "You analyze trends in strength, volume, weight, and nutrition. "
            "You give specific, practical tips (form cues, progressive overload, recovery, protein). "
            "You are honest: if the user is plateauing, skipping workouts, or missing muscle groups, "
            "you say so kindly and suggest a fix — never empty praise. "
            "You NEVER give medical advice. For pain or injuries, suggest seeing a professional. "
            "Keep responses concise and actionable.\n\n"
        )
        if context:
            base += "USER CONTEXT:\n"
            for key, value in context.items():
                if value is not None:
                    base += f"- {key}: {value}\n"
        return base


def create_ai_service() -> AIService:
    """Factory: use Gemini if API key is set, otherwise use mock."""
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY not in ("mock", "mock_key", ""):
        return AIService(GeminiProvider())
    logger.warning("No GEMINI_API_KEY set — using MockProvider")
    return AIService(MockProvider())


ai_service = create_ai_service()
