from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class SymptomInput(BaseModel):
    symptoms_text: Optional[str] = None
    body_map_selections: Optional[List[str]] = None
    language: str = "en"
    age_years: Optional[int] = None
    gender: Optional[str] = None
    fever_duration_days: Optional[float] = None
    symptom_duration_hours: Optional[float] = None
    symptom_count: Optional[int] = None
    chest_pain_minutes: Optional[float] = None
    spo2_percent: Optional[float] = None
    bp_systolic: Optional[float] = None
    maternal_bleeding: Optional[int] = None
    prior_condition_flag: Optional[int] = None

class CaseCreate(BaseModel):
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    abha_id: Optional[str] = None
    facility_id: Optional[str] = None
    symptoms: SymptomInput

class CaseResponse(BaseModel):
    id: str
    pseudonymous_id: str
    status: str
    risk_tag: Optional[str] = None
    rule_id: Optional[str] = None
    rule_message: Optional[str] = None
    symptoms_text: Optional[str] = None
    symptoms_structured: Optional[Dict[str, Any]] = None
    extracted_data: Optional[Dict[str, Any]] = None
    llm_summary: Optional[str] = None
    follow_up_questions: Optional[List[str]] = None
    facility_id: Optional[str] = None
    language: str
    created_at: datetime
    updated_at: datetime
    body_map_selections: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)

class CaseDetail(CaseResponse):
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    age_years: Optional[int] = None
    gender: Optional[str] = None
    audit_trail: List[Dict[str, Any]] = []

class QueueItem(BaseModel):
    id: str
    pseudonymous_id: str
    risk_tag: Optional[str] = None
    rule_message: Optional[str] = None
    symptoms_text: Optional[str] = None
    facility_id: Optional[str] = None
    status: str
    created_at: datetime
    waiting_minutes: int
