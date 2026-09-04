from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import case
from datetime import datetime
from app.core.database import get_db
from app.models.case import Case
from app.schemas.case import QueueItem

router = APIRouter()

@router.get("/", response_model=List[QueueItem])
def get_queue(facility_id: Optional[str] = None, status: str = "DRAFT", db: Session = Depends(get_db)):
    query = db.query(Case).filter(Case.status == status)
    if facility_id:
        query = query.filter(Case.facility_id == facility_id)
        
    risk_order = case(
        (Case.risk_tag == 'RED', 1),
        (Case.risk_tag == 'AMBER', 2),
        (Case.risk_tag == 'GREEN', 3),
        else_=4
    )
    
    cases = query.order_by(risk_order, Case.created_at.asc()).all()
    
    items = []
    now = datetime.utcnow()
    for c in cases:
        wait_mins = int((now - c.created_at).total_seconds() / 60)
        items.append(
            QueueItem(
                id=c.id,
                pseudonymous_id=c.pseudonymous_id,
                risk_tag=c.risk_tag,
                rule_message=c.rule_message,
                symptoms_text=c.symptoms_text,
                facility_id=c.facility_id,
                status=c.status,
                created_at=c.created_at,
                waiting_minutes=wait_mins
            )
        )
    return items