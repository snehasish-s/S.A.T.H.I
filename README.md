# SAHAYAK-Triage (सहायक)
> *Smart Automated Healthcare Assistant for Yielding Actionable Knowledge & Triage*
> *सहायक — भारत के प्राथमिक स्वास्थ्य केंद्रों के लिए बहुभाषी एवं बहु-प्रारूपीय ट्राइएज प्रणाली*

[![CI](https://github.com/snehasish-s/S.A.T.H.I/actions/workflows/ci.yml/badge.svg)](https://github.com/snehasish-s/S.A.T.H.I/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB.svg?logo=react)](https://react.dev/)

---

## 📌 Pitch & Overview

**SAHAYAK-Triage** is an intelligent, multimodal healthcare triage assistant designed specifically for Primary Health Centres (PHCs), Community Health Centres (CHCs), and frontline health workers (ASHA/ANM) across rural and semi-urban India. Operating in low-connectivity, resource-constrained environments, SAHAYAK unifies patient voice notes in vernacular languages (via Whisper STT), printed and handwritten diagnostic lab reports (via Tesseract OCR), and interactive anatomical body-map inputs into a centralized, deterministic triage workflow. By prioritizing high-risk clinical "red flags" (maternal hemorrhage, acute chest pain, pediatric respiratory distress, severe dehydration) through a hardcoded rules engine before running local LLM summarization, SAHAYAK empowers nurses and medical officers to quickly prioritize acute emergencies, accelerate informed consultations, and generate structured bilingual referral notes.

---

## 🏛 Architecture Overview

The system follows a strict, safety-oriented, human-in-the-loop pipeline structured into five distinct operational layers:

```
[ Layer 1: Access ]
       │  (Web Portal, ASHA/ANM Mobile, WhatsApp/SMS Webhooks)
       ▼
[ Layer 2: Backend ]
       │  (FastAPI REST Gateway, JWT RBAC, PII Isolation, Rate Limiting)
       ▼
[ Layer 3: AI / ML Pipeline ]
       │  (Tesseract OCR, Whisper STT, Deterministic Rules Engine, LLM Summarizer)
       ▼
[ Layer 4: Data & Persistence ]
       │  (PostgreSQL/SQLite, Hash-Chained Audit Trail, Sync Worker)
       ▼
[ Layer 5: Human Review ]
          (Doctor / Nurse Dashboard: Accept, Edit, or Override Triage)
```

1. **Access Layer**: Frontline entry points including a responsive React Progressive Web App (PWA) with visual body-map symptom picker, audio voice recording, document camera capture, and lightweight WhatsApp/SMS webhook integrations for asynchronous community intake.
2. **Backend Gateway Layer**: Asynchronous FastAPI core service enforcing ABHA/consent checks, token-based Role-Based Access Control (RBAC), field-level PII separation from clinical observations, and offline queue synchronization.
3. **AI/ML Processing Layer**: Multimodal pipeline that transcribes vernacular audio via Whisper, parses clinical test values via Tesseract OCR, evaluates deterministic clinical safety rules (YAML-defined critical thresholds), and synthesizes clinical digests using localized LLM models (e.g., Llama-3 via Ollama).
4. **Data & Persistence Layer**: Secure primary storage (PostgreSQL in cloud/server mode or SQLite in offline edge mode) coupled with an immutable, cryptographic hash-chained audit ledger ensuring tamper-evident tracking of all intake, inference, and human decisions.
5. **Human Review Layer**: The final authoritative tier where accredited clinicians and triage nurses inspect prioritized queues (RED / YELLOW / GREEN), review objective evidence alongside AI summaries, and accept, edit, or override clinical risk classifications.

---

## 🧰 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Web** | React 18, Vite, Tailwind CSS, Lucide Icons | Responsive PWA interface, interactive body map, audio recorder |
| **Backend API** | Python 3.11, FastAPI, Pydantic v2, SQLAlchemy | Async RESTful API, validation, dependency injection, CORS |
| **Database** | PostgreSQL 16 (Online) / SQLite (Offline Edge) | Relational case store with JSONB support and offline sync worker |
| **OCR Service** | Tesseract OCR + OpenCV / PyTesseract | Optical character recognition for physical lab slips and prescriptions |
| **Speech-to-Text** | OpenAI Whisper (Local / Distil-Whisper) | Multilingual voice note transcription (Hindi, regional dialects, English) |
| **Safety Engine** | Deterministic Python Rules Engine (`risk_rules.yaml`) | Hardcoded clinical triage logic running prior to LLM evaluation |
| **LLM Summarizer** | Ollama / Llama 3 (8B Instruct Q4) | Local inference for structured case summarization & follow-up questions |
| **Security & Auth**| Python-Jose, Passlib (Bcrypt), SHA-256 Hashing | JWT authentication, role enforcement, tamper-evident audit chaining |
| **Containerization**| Docker, Docker Compose Alpine images | Reproducible multi-container stack for edge nodes and cloud servers |

---

## 🚀 Quick Start (Docker Compose)

The fastest way to spin up the entire SAHAYAK-Triage stack (FastAPI backend, PostgreSQL database, and React frontend) is using Docker Compose:

```bash
# 1. Clone repository and navigate to project root
cd d:\sahayak-triage

# 2. Copy environment template
cp .env.example .env

# 3. Build and launch all services
docker compose -f infra/docker-compose.yml up --build
```

Once running:
- **Frontend Web UI**: [http://localhost:5173](http://localhost:5173)
- **Backend Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc API Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Live Demo**: *[Coming soon]*

---

## 💻 Local Development Setup

If running services directly on your host machine for development:

### Prerequisites
- Python 3.11+
- Node.js 20+ and npm
- Tesseract OCR (`tesseract-ocr` system package)
- FFmpeg (for audio processing)

### Backend Setup
```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux / macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations / seed initial accounts (if needed)
# Run FastAPI development server with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Default Demo Credentials

Pre-seeded role accounts for evaluation and local testing:

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Medical Officer (Doctor)** | `demo_doctor` | `demo123` | Full case review, clinical override, queue prioritization, referral generation |
| **Staff Nurse / Triage Nurse** | `demo_nurse` | `demo123` | Patient intake, report/voice upload, vitals entry, initial triage verification |

---

## ⚠️ Mandatory Healthcare Disclaimer

> [!CAUTION]
> **EDUCATIONAL AND RESEARCH PROTOTYPE ONLY — NON-DIAGNOSTIC SYSTEM**
>
> SAHAYAK-Triage is designed solely as an experimental clinical decision-support and workflow optimization prototype. 
> 1. **Not a Medical Device**: SAHAYAK-Triage does **not** provide clinical diagnoses, prescribe treatments, or substitute for professional medical judgment.
> 2. **Synthetic Data Only**: All demo datasets, test cases, and patient records provided or generated are strictly synthetic and de-identified.
> 3. **Mandatory Human-in-the-Loop**: No clinical action, triage classification, or referral may be finalized without explicit verification and approval by a certified Medical Officer or authorized healthcare professional.

---

## 📄 License

This project is open-source software licensed under the **[MIT License](LICENSE)**.
