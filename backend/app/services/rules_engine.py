import yaml
from pathlib import Path

RULES_PATH = Path(__file__).parent.parent / "rules" / "risk_rules.yaml"

def load_rules():
    with open(RULES_PATH, "r") as f:
        return yaml.safe_load(f)["rules"]

def _check_condition(cond, case_data):
    value = case_data.get(cond["field"])
    if value is None:
        return False
    op, target = cond["op"], cond["value"]
    if op == "<":
        return value < target
    if op == ">":
        return value > target
    if op == ">=":
        return value >= target
    if op == "<=":
        return value <= target
    if op == "==":
        return value == target
    return False

def evaluate(case_data: dict) -> dict:
    """Deterministic risk evaluation. Runs BEFORE any LLM call."""
    for rule in load_rules():
        block = rule["when"]
        if "any" in block:
            matched = any(_check_condition(c, case_data) for c in block["any"])
        else:
            matched = all(_check_condition(c, case_data) for c in block["all"])
        if matched:
            return {"tag": rule["tag"], "rule_id": rule["id"], "message": rule["message"]}
    return {"tag": "GREEN", "rule_id": None, "message": "No red-flag criteria met."}