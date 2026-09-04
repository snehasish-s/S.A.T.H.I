from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.case import Consent as ConsentModel
from app.models.user import User
from app.schemas.review import AuthLogin, AuthRegister, TokenResponse
from pydantic import BaseModel

router = APIRouter()

class ConsentCreate(BaseModel):
    case_id: str
    consented: bool
    language: str = "en"

@router.post("/")
def record_consent(consent: ConsentCreate, request: Request, db: Session = Depends(get_db)):
    db_consent = ConsentModel(
        case_id=consent.case_id,
        consented=consent.consented,
        consent_language=consent.language,
        ip_address=request.client.host if request.client else None
    )
    db.add(db_consent)
    db.commit()
    return {"status": "recorded"}

@router.post("/auth/login", response_model=TokenResponse)
def login(login_data: AuthLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token({"sub": user.username, "role": user.role})
    return TokenResponse(access_token=token, role=user.role)

@router.post("/auth/register", response_model=TokenResponse)
def register(reg_data: AuthRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == reg_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username taken")
        
    user = User(
        username=reg_data.username,
        email=reg_data.email,
        role=reg_data.role,
        facility_id=reg_data.facility_id,
        hashed_password=get_password_hash(reg_data.password)
    )
    db.add(user)
    db.commit()
    
    token = create_access_token({"sub": user.username, "role": user.role})
    return TokenResponse(access_token=token, role=user.role)