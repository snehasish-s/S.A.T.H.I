import uuid
import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.case import Case, PatientIdentity
from app.schemas.case import CaseCreate, CaseResponse
from app.services import audit_service, ocr_service, stt_service, translation_service, llm_service
from app.rules import engine

router = APIRouter()

def process_llm_summary(case_id: str, case_data: dict, risk_result: dict, db: Session):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    summary_result = loop.run_until_complete(llm_service.generate_summary(case_data, risk_result))
    loop.close()
    
    case = db.query(Case).filter(Case.id == case_id).first()
    if case:
        case.llm_summary = summary_result.get('summary')
        case.follow_up_questions = summary_result.get('follow_up_questions')
        db.commit()
        audit_service.append_entry(db, case_id, None, "LLM_SUMMARY", summary_result)

@router.post("/", response_model=CaseResponse)
def create_case(case_in: CaseCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    case_id = str(uuid.uuid4())
    pseudo_id = str(uuid.uuid4())
    
    symptoms_dict = case_in.symptoms.model_dump()
    risk_result = engine.evaluate(symptoms_dict)
    
    db_case = Case(
        id=case_id,
        pseudonymous_id=pseudo_id,
        risk_tag=risk_result.get("tag"),
        rule_id=risk_result.get("rule_id"),
        rule_message=risk_result.get("message"),
        symptoms_text=case_in.symptoms.symptoms_text,
        symptoms_structured=symptoms_dict,
        body_map_selections=case_in.symptoms.body_map_selections,
        facility_id=case_in.facility_id,
        language=case_in.symptoms.language
    )
    db.add(db_case)
    
    if case_in.patient_name or case_in.patient_phone or case_in.abha_id:
        pii = PatientIdentity(
            case_id=case_id,
            name=case_in.patient_name,
            phone=case_in.patient_phone,
            abha_id=case_in.abha_id,
            age_years=case_in.symptoms.age_years,
            gender=case_in.symptoms.gender
        )
        db.add(pii)
        
    db.commit()
    db.refresh(db_case)
    
    audit_service.append_entry(db, case_id, None, "CREATED", {"risk": risk_result})
    
    case_data = {
        "symptoms_text": db_case.symptoms_text,
        "symptoms_structured": db_case.symptoms_structured,
        "extracted_data": db_case.extracted_data
    }
    background_tasks.add_task(process_llm_summary, case_id, case_data, risk_result, db)
    
    return db_case

@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.post("/{case_id}/report", response_model=CaseResponse)
def upload_report(case_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    content = file.file.read()
    ocr_result = ocr_service.process_report(content)
    
    current_extracted = case.extracted_data or {}
    current_extracted.update(ocr_result.get("parsed_values", {}))
    case.extracted_data = current_extracted
    
    # Re-evaluate rules
    all_symptoms = case.symptoms_structured or {}
    all_symptoms.update(current_extracted)
    risk_result = engine.evaluate(all_symptoms)
    
    case.risk_tag = risk_result.get("tag")
    case.rule_id = risk_result.get("rule_id")
    case.rule_message = risk_result.get("message")
    
    db.commit()
    db.refresh(case)
    
    audit_service.append_entry(db, case_id, None, "REPORT_UPLOADED", {"ocr": ocr_result, "new_risk": risk_result})
    
    return case

@router.post("/{case_id}/voice", response_model=CaseResponse)
def upload_voice(case_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    content = file.file.read()
    stt_result = stt_service.transcribe(content)
    transcript = stt_result.get("text", "")
    
    translation_result = translation_service.translate_to_english(transcript)
    
    case.voice_transcript = translation_result.get("translated", transcript)
    case.voice_language = translation_result.get("source_language", "en")
    db.commit()
    db.refresh(case)
    
    audit_service.append_entry(db, case_id, None, "VOICE_UPLOADED", {"transcript": transcript, "translation": translation_result})
    return case

@router.delete("/patients/{patient_case_id}")
def delete_patient_data(patient_case_id: str, db: Session = Depends(get_db)):
    pii = db.query(PatientIdentity).filter(PatientIdentity.case_id == patient_case_id).first()
    if pii:
        db.delete(pii)
    
    case = db.query(Case).filter(Case.id == patient_case_id).first()
    if case:
        case.symptoms_text = "[REDACTED]"
        case.voice_transcript = "[REDACTED]"
        db.commit()
        audit_service.append_entry(db, patient_case_id, None, "DELETED", {"reason": "Right to forget"})
        
    return {"status": "anonymized"}