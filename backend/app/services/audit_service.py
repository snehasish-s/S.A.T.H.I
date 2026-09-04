import hashlib
import json
from sqlalchemy.orm import Session
from app.models.audit import AuditEntry

def compute_hash(previous_hash: str | None, content: str) -> str:
    base = (previous_hash or "") + content
    return hashlib.sha256(base.encode("utf-8")).hexdigest()

def append_entry(db: Session, case_id: str, actor_id: int | None, action: str, detail: dict) -> AuditEntry:
    last_entry = db.query(AuditEntry).filter(AuditEntry.case_id == case_id).order_by(AuditEntry.id.desc()).first()
    previous_hash = last_entry.current_hash if last_entry else None
    
    content = json.dumps(detail, sort_keys=True) + action + case_id
    current_hash = compute_hash(previous_hash, content)
    
    entry = AuditEntry(
        case_id=case_id,
        actor_id=actor_id,
        action=action,
        detail=detail,
        previous_hash=previous_hash,
        current_hash=current_hash
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def get_trail(db: Session, case_id: str) -> list[AuditEntry]:
    return db.query(AuditEntry).filter(AuditEntry.case_id == case_id).order_by(AuditEntry.created_at.asc()).all()

def verify_chain(db: Session, case_id: str) -> dict:
    entries = get_trail(db, case_id)
    if not entries:
        return {"valid": True, "entries_checked": 0, "broken_at": None}
    
    expected_previous = None
    for entry in entries:
        if entry.previous_hash != expected_previous:
            return {"valid": False, "entries_checked": len(entries), "broken_at": entry.id}
        
        content = json.dumps(entry.detail, sort_keys=True) + entry.action + entry.case_id
        expected_current = compute_hash(entry.previous_hash, content)
        
        if entry.current_hash != expected_current:
            return {"valid": False, "entries_checked": len(entries), "broken_at": entry.id}
        
        expected_previous = entry.current_hash
        
    return {"valid": True, "entries_checked": len(entries), "broken_at": None}
