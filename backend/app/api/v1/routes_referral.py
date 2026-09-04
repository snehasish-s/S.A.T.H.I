from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.case import Case
from app.schemas.review import ReferralNote
from app.services import audit_service
import json

router = APIRouter()

@router.post("/{case_id}", response_model=ReferralNote)
def create_referral(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    structured = case.symptoms_structured or {}
    timeline = ""
    if structured.get('symptom_duration_hours'):
        timeline += f"Symptoms for {structured.get('symptom_duration_hours')} hours. "
    if structured.get('fever_duration_days'):
        timeline += f"Fever for {structured.get('fever_duration_days')} days."
        
    extracted = case.extracted_data or {}
    vitals = ", ".join([f"{k}: {v}" for k, v in extracted.items() if k in ['bp_systolic', 'bp_diastolic', 'spo2_percent', 'temperature']])
    labs = ", ".join([f"{k}: {v}" for k, v in extracted.items() if k not in ['bp_systolic', 'bp_diastolic', 'spo2_percent', 'temperature']])
    
    note = ReferralNote(
        case_id=case.id,
        patient_pseudonymous_id=case.pseudonymous_id,
        chief_complaint=case.symptoms_text,
        symptom_timeline=timeline,
        vitals_summary=vitals,
        ocr_lab_summary=labs,
        risk_tag=case.override_tag or case.risk_tag,
        rule_message=case.rule_message,
        referral_reason="System generated referral based on risk assessment",
        generated_at=datetime.utcnow()
    )
    
    case.referral_note = note.model_dump_json()
    case.status = "ACTIONED"
    db.commit()
    
    audit_service.append_entry(db, case_id, None, "REFERRED", {"note": note.model_dump(mode='json')})
    
    return note