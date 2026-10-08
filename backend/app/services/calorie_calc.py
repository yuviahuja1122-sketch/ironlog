def calculate_calories(weight_kg: float, height_cm: float, age: int, activity_level: str, goal: str):
    # BMR (male default): 10 * weight + 6.25 * height - 5 * age + 5
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    
    activity_multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    
    tdee = bmr * activity_multipliers.get(activity_level, 1.2)
    
    if goal == "cut":
        target_calories = tdee - 500
        target_protein = weight_kg * 2.2
    elif goal == "bulk":
        target_calories = tdee + 300
        target_protein = weight_kg * 2.0
    elif goal == "maintain":
        target_calories = tdee
        target_protein = weight_kg * 1.8
    elif goal == "recomp":
        target_calories = tdee - 100
        target_protein = weight_kg * 2.2
    else:
        target_calories = tdee
        target_protein = weight_kg * 1.8
        
    return {
        "bmr": round(bmr, 2),
        "tdee": round(tdee, 2),
        "target_calories": round(target_calories, 2),
        "target_protein": round(target_protein, 2)
    }
