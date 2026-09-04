from fastapi import APIRouter, Request, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.case import Case
from app.services import audit_service
import uuid

router = APIRouter()

@router.get("/")
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge")
):
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Invalid verify token")

@router.post("/")
async def receive_message(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    
    try:
        entries = data.get("entry", [])
        for entry in entries:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])
                
                for msg in messages:
                    msg_type = msg.get("type")
                    from_phone = msg.get("from")
                    
                    case_id = str(uuid.uuid4())
                    pseudo_id = str(uuid.uuid4())
                    text_content = ""
                    
                    if msg_type == "text":
                        text_content = msg.get("text", {}).get("body", "")
                        
                    db_case = Case(
                        id=case_id,
                        pseudonymous_id=pseudo_id,
                        symptoms_text=text_content,
                        facility_id="whatsapp",
                        symptoms_structured={"source": "whatsapp", "phone_suffix": from_phone[-4:]}
                    )
                    db.add(db_case)
                    db.commit()
                    
                    audit_service.append_entry(db, case_id, None, "CREATED_FROM_WHATSAPP", {"msg_type": msg_type})
                    
    except Exception as e:
        print(f"Error processing webhook: {e}")
        
    return {"status": "ok"}