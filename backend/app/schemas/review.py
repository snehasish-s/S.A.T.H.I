from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ReviewAction(BaseModel):
    action: str  # 'accept' | 'edit' | 'override'
    notes: Optional[str] = None
    override_tag: Optional[str] = None
    override_reason: Optional[str] = None

class ReviewResponse(BaseModel):
    case_id: str
    status: str
    risk_tag: Optional[str] = None
    reviewed_by: Optional[int] = None
    review_notes: Optional[str] = None
    updated_at: datetime

class ReferralNote(BaseModel):
    case_id: str
    patient_pseudonymous_id: str
    chief_complaint: Optional[str] = None
    symptom_timeline: Optional[str] = None
    vitals_summary: Optional[str] = None
    ocr_lab_summary: Optional[str] = None
    risk_tag: Optional[str] = None
    rule_message: Optional[str] = None
    referral_reason: str
    generated_at: datetime

class AuthLogin(BaseModel):
    username: str
    password: str

class AuthRegister(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    role: str = "NURSE"
    facility_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
