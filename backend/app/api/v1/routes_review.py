from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_role, get_current_user
from app.models.case import Case
from app.models.user import User
from app.schemas.review import ReviewAction, ReviewResponse
from app.services import audit_service

router = APIRouter()

@router.post("/{case_id}", response_model=ReviewResponse)
def review_case(
    case_id: str,
    action: ReviewAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["NURSE", "DOCTOR"]))
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    if case.status == "DRAFT":
        case.status = "REVIEWED"
    elif case.status == "REVIEWED":
        case.status = "ACTIONED"
        
    if action.action == "accept":
        case.reviewed_by = current_user.id
        case.review_notes = action.notes
    elif action.action == "edit":
        case.review_notes = action.notes
    elif action.action == "override":
        case.override_tag = action.override_tag
        case.review_notes = action.notes
        
    db.commit()
    db.refresh(case)
    
    audit_service.append_entry(
        db, case_id, current_user.id, "REVIEWED", 
        {"action": action.action, "notes": action.notes, "override": action.override_tag, "reason": action.override_reason}
    )
    
    return ReviewResponse(
        case_id=case.id,
        status=case.status,
        risk_tag=case.override_tag or case.risk_tag,
        reviewed_by=case.reviewed_by,
        review_notes=case.review_notes,
        updated_at=case.updated_at
    )