import pytest
from app.services.ai_service import AIService, MockProvider

@pytest.fixture
def mock_ai():
    return AIService(MockProvider())

@pytest.mark.asyncio
async def test_replan_returns_exercises(mock_ai):
    result = await mock_ai.replan_workout(
        {"sore_muscles": ["chest", "triceps"], "severity": 4},
        {"label": "Push", "exercises": [{"exercise_name": "Bench Press", "body_part": "chest"}]},
        {"chest": {"planned": 12, "completed": 12}, "shoulders": {"planned": 10, "completed": 0}},
    )
    assert "exercises" in result
    assert len(result["exercises"]) > 0
    assert "reason" in result

@pytest.mark.asyncio
async def test_nutrition_estimate_returns_macros(mock_ai):
    result = await mock_ai.estimate_nutrition("2 rotis, dal, 200g paneer")
    assert "calories" in result
    assert "protein_g" in result
    assert result["calories"] > 0

@pytest.mark.asyncio
async def test_chat_returns_string(mock_ai):
    result = await mock_ai.chat("How am I doing?", {"name": "Yuvi", "goal": "cut"})
    assert isinstance(result, str)
    assert len(result) > 0

@pytest.mark.asyncio
async def test_motivation_returns_string(mock_ai):
    result = await mock_ai.motivation_message({"name": "Yuvi", "streak": 5})
    assert isinstance(result, str)
    assert len(result) > 0
