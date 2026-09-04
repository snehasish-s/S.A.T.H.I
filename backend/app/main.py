from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, SessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from app.api.v1 import routes_cases, routes_queue, routes_review, routes_referral, routes_audit, routes_consent
from app.api.v1.webhooks import whatsapp, sms

app = FastAPI(title="SAHAYAK-Triage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    
    db = SessionLocal()
    try:
        # Seed demo users
        demo_doc = db.query(User).filter(User.username == "demo_doctor").first()
        if not demo_doc:
            db.add(User(username="demo_doctor", hashed_password=get_password_hash("demo123"), role="DOCTOR"))
            
        demo_nurse = db.query(User).filter(User.username == "demo_nurse").first()
        if not demo_nurse:
            db.add(User(username="demo_nurse", hashed_password=get_password_hash("demo123"), role="NURSE"))
            
        db.commit()
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(routes_consent.router, prefix="/api/v1/consent", tags=["Consent & Auth"])
app.include_router(routes_cases.router, prefix="/api/v1/cases", tags=["Cases"])
app.include_router(routes_queue.router, prefix="/api/v1/queue", tags=["Queue"])
app.include_router(routes_review.router, prefix="/api/v1/review", tags=["Review"])
app.include_router(routes_referral.router, prefix="/api/v1/referral", tags=["Referral"])
app.include_router(routes_audit.router, prefix="/api/v1/audit", tags=["Audit"])

app.include_router(whatsapp.router, prefix="/api/v1/webhooks/whatsapp", tags=["Webhooks"])
app.include_router(sms.router, prefix="/api/v1/webhooks/sms", tags=["Webhooks"])