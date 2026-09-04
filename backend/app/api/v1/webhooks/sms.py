from fastapi import APIRouter, Request, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.case import Case
from app.services import audit_service
import uuid

router = APIRouter()

@router.post("/")
async def receive_sms(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    
    body = form_data.get("Body", "")
    from_phone = form_data.get("From", "")
    
    case_id = str(uuid.uuid4())
    pseudo_id = str(uuid.uuid4())
    
    db_case = Case(
        id=case_id,
        pseudonymous_id=pseudo_id,
        symptoms_text=body,
        facility_id="sms",
        symptoms_structured={"source": "sms", "phone_suffix": from_phone[-4:] if from_phone else ""}
    )
    db.add(db_case)
    db.commit()
    
    audit_service.append_entry(db, case_id, None, "CREATED_FROM_SMS", {"sms_length": len(body)})
    
    twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Your triage request has been received. A medical professional will review it shortly. Case ID: {pseudo_id[:8]}</Message>
</Response>"""

    return Response(content=twiml_response, media_type="application/xml")