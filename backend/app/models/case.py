from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, JSON, Boolean, DateTime, ForeignKey
from app.core.database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True)
    pseudonymous_id = Column(String(36), nullable=False)
    status = Column(String(20), default="DRAFT")
    risk_tag = Column(String(10), nullable=True)
    rule_id = Column(String(20), nullable=True)
    rule_message = Column(Text, nullable=True)
    symptoms_text = Column(Text, nullable=True)
    symptoms_structured = Column(JSON, nullable=True)
    body_map_selections = Column(JSON, nullable=True)
    extracted_data = Column(JSON, nullable=True)
    original_report_path = Column(String(500), nullable=True)
    voice_transcript = Column(Text, nullable=True)
    voice_language = Column(String(20), nullable=True)
    llm_summary = Column(Text, nullable=True)
    follow_up_questions = Column(JSON, nullable=True)
    facility_id = Column(String(100), nullable=True)
    language = Column(String(10), default="en")
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_notes = Column(Text, nullable=True)
    override_tag = Column(String(10), nullable=True)
    referral_note = Column(Text, nullable=True)
    is_synced = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PatientIdentity(Base):
    __tablename__ = "patient_identities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    name = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    abha_id = Column(String(50), nullable=True)
    age_years = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Consent(Base):
    __tablename__ = "consents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=True)
    consented = Column(Boolean, nullable=False)
    consent_language = Column(String(10), default="en")
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
