import pytest
from app.rules import engine

def test_red_low_spo2():
    res = engine.evaluate({"spo2_percent": 88})
    assert res["tag"] == "RED"
    assert res["rule_id"] == "R001"

def test_red_chest_pain():
    res = engine.evaluate({"chest_pain_minutes": 45})
    assert res["tag"] == "RED"
    assert res["rule_id"] == "R001"

def test_red_high_bp():
    res = engine.evaluate({"bp_systolic": 190})
    assert res["tag"] == "RED"
    assert res["rule_id"] == "R002"

def test_red_maternal_bleeding():
    res = engine.evaluate({"maternal_bleeding": 1})
    assert res["tag"] == "RED"
    assert res["rule_id"] == "R002"

def test_amber_child_fever():
    res = engine.evaluate({"fever_duration_days": 4, "age_years": 3})
    assert res["tag"] == "AMBER"
    assert res["rule_id"] == "R003"

def test_amber_prolonged_prior():
    res = engine.evaluate({"symptom_duration_hours": 80, "prior_condition_flag": 1})
    assert res["tag"] == "AMBER"
    assert res["rule_id"] == "R004"

def test_green_mild():
    res = engine.evaluate({"symptom_count": 1, "symptom_duration_hours": 12})
    assert res["tag"] == "GREEN"
    assert res["rule_id"] == "R005"

def test_green_default():
    res = engine.evaluate({})
    assert res["tag"] == "GREEN"
    assert res["rule_id"] is None

def test_missing_fields():
    res = engine.evaluate({"symptom_duration_hours": 80})
    assert res["tag"] == "GREEN"
    assert res["rule_id"] is None
