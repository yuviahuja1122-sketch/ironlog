import pytest
from app.services.calorie_calc import calculate_calories

def test_cut_calories():
    res = calculate_calories(weight_kg=78, height_cm=175, age=25, activity_level="moderate", goal="cut")
    assert res["bmr"] == round(10 * 78 + 6.25 * 175 - 5 * 25 + 5, 2)
    assert res["tdee"] == round(res["bmr"] * 1.55, 2)
    assert res["target_calories"] == round(res["tdee"] - 500, 2)
    assert res["target_protein"] == round(78 * 2.2, 2)

def test_bulk_calories():
    res = calculate_calories(weight_kg=70, height_cm=170, age=22, activity_level="active", goal="bulk")
    assert res["target_calories"] == round(res["tdee"] + 300, 2)
    assert res["target_protein"] == round(70 * 2.0, 2)

def test_maintain_calories():
    res = calculate_calories(weight_kg=80, height_cm=180, age=30, activity_level="sedentary", goal="maintain")
    assert res["target_calories"] == round(res["tdee"], 2)
    assert res["target_protein"] == round(80 * 1.8, 2)

def test_recomp_calories():
    res = calculate_calories(weight_kg=75, height_cm=175, age=28, activity_level="moderate", goal="recomp")
    assert res["target_calories"] == round(res["tdee"] - 100, 2)
    assert res["target_protein"] == round(75 * 2.2, 2)

def test_unknown_activity_defaults():
    res = calculate_calories(weight_kg=80, height_cm=180, age=30, activity_level="unknown_level", goal="maintain")
    expected_tdee = round(res["bmr"] * 1.2, 2)
    assert res["tdee"] == expected_tdee
