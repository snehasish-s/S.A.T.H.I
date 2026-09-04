import httpx
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

def template_summary(case_data: dict, risk_result: dict) -> dict:
    summary_parts = []
    if risk_result.get("tag"):
        summary_parts.append(f"Risk Tag: {risk_result.get('tag')} - {risk_result.get('message', '')}")
    
    if case_data.get("symptoms_text"):
        summary_parts.append(f"Reported symptoms: {case_data.get('symptoms_text')}")
        
    structured = case_data.get("symptoms_structured", {})
    if structured:
        summary_parts.append(f"Structured data: {json.dumps(structured)}")
        
    follow_ups = []
    if not structured.get("age_years"):
        follow_ups.append("What is the patient's age?")
    if risk_result.get("tag") in ["RED", "AMBER"] and not structured.get("spo2_percent"):
        follow_ups.append("Please check patient's SpO2 levels.")
        
    return {
        "summary": " | ".join(summary_parts),
        "follow_up_questions": follow_ups or ["Any other relevant symptoms?"],
        "source": "template",
        "disclaimer": "AI-drafted, advisory only — reviewer must confirm"
    }

async def generate_summary(case_data: dict, risk_result: dict) -> dict:
    prompt = f"""
You are a triage support assistant. You do NOT diagnose or prescribe.
Review the following patient data:
Risk Tag: {risk_result.get('tag')}
Reason: {risk_result.get('message')}
Symptoms (Text): {case_data.get('symptoms_text', 'N/A')}
Structured Symptoms: {json.dumps(case_data.get('symptoms_structured', {}))}
Extracted Labs: {json.dumps(case_data.get('extracted_data', {}))}

Provide:
1. A brief narrative summary of the case.
2. 3-5 follow-up questions for the medical reviewer to ask the patient.
Format your response as a JSON object with keys "summary" (string) and "follow_up_questions" (list of strings).
"""
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "model": settings.LLM_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            }
            response = await client.post(f"{settings.LLM_BASE_URL}/api/generate", json=payload, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                result = json.loads(data.get("response", "{}"))
                return {
                    "summary": result.get("summary", ""),
                    "follow_up_questions": result.get("follow_up_questions", []),
                    "source": "llm",
                    "disclaimer": "AI-drafted, advisory only — reviewer must confirm"
                }
            else:
                return template_summary(case_data, risk_result)
    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        return template_summary(case_data, risk_result)
