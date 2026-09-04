from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.case import Case
from app.services import audit_service

router = APIRouter()

@router.get("/{case_id}")
def get_audit_trail(case_id: str, db: Session = Depends(get_db)):
    entries = audit_service.get_trail(db, case_id)
    return {"case_id": case_id, "trail": entries}

@router.get("/{case_id}/verify")
def verify_audit_trail(case_id: str, db: Session = Depends(get_db)):
    return audit_service.verify_chain(db, case_id)

@router.get("/analytics/aggregate")
def get_aggregate_analytics(db: Session = Depends(get_db)):
    total = db.query(Case).count()
    
    # k-anonymize
    def anonymize(count):
        return count if count >= 5 else "<5"
        
    by_risk = db.query(Case.risk_tag, func.count(Case.id)).group_by(Case.risk_tag).all()
    by_risk_dict = {tag or "None": anonymize(count) for tag, count in by_risk}
    
    by_facility = db.query(Case.facility_id, func.count(Case.id)).group_by(Case.facility_id).all()
    by_facility_dict = {fac or "None": anonymize(count) for fac, count in by_facility}
    
    by_status = db.query(Case.status, func.count(Case.id)).group_by(Case.status).all()
    by_status_dict = {status or "None": anonymize(count) for status, count in by_status}
    
    return {
        "total_cases": total,
        "by_risk": by_risk_dict,
        "by_facility": by_facility_dict,
        "by_status": by_status_dict
    }