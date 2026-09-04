def evaluate(symptoms: dict) -> dict:
    if symptoms.get('spo2_percent') and symptoms['spo2_percent'] < 90:
        return {"tag": "RED", "rule_id": "R001", "message": "Low SpO2"}
    if symptoms.get('chest_pain_minutes') and symptoms['chest_pain_minutes'] > 30:
        return {"tag": "RED", "rule_id": "R001", "message": "Prolonged chest pain"}
    if symptoms.get('bp_systolic') and symptoms['bp_systolic'] > 180:
        return {"tag": "RED", "rule_id": "R002", "message": "Hypertensive crisis"}
    if symptoms.get('maternal_bleeding') == 1:
        return {"tag": "RED", "rule_id": "R002", "message": "Maternal bleeding"}
    if symptoms.get('fever_duration_days') and symptoms['fever_duration_days'] >= 3 and symptoms.get('age_years') and symptoms['age_years'] <= 5:
        return {"tag": "AMBER", "rule_id": "R003", "message": "Prolonged fever in child"}
    if symptoms.get('symptom_duration_hours') and symptoms['symptom_duration_hours'] > 72 and symptoms.get('prior_condition_flag') == 1:
        return {"tag": "AMBER", "rule_id": "R004", "message": "Prolonged symptoms with prior condition"}
    if symptoms.get('symptom_count') and symptoms['symptom_count'] > 0:
        return {"tag": "GREEN", "rule_id": "R005", "message": "Mild symptoms"}
    return {"tag": "GREEN", "rule_id": None, "message": "No specific risk identified"}
