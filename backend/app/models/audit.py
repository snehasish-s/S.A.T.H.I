from datetime import datetime
from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from app.core.database import Base

class AuditEntry(Base):
    __tablename__ = "audit_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    actor_id = Column(Integer, nullable=True)
    action = Column(String(50), nullable=False)
    detail = Column(JSON, nullable=True)
    previous_hash = Column(String(64), nullable=True)
    current_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
