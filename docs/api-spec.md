# SAHAYAK-Triage: REST API Specification (v1)

> **Base URL**: `http://localhost:8000` (or `https://sahayak-backend.onrender.com`)  
> **API Version**: `v1`  
> **OpenAPI / Swagger UI**: `/docs`  
> **Interactive ReDoc**: `/redoc`

---

## Authentication & Authorization Overview

Authentication is implemented via **JSON Web Tokens (JWT)** using the `HS256` signature algorithm. 

To access protected endpoints:
1. Obtain an access token by sending credentials to `POST /api/v1/consent/auth/login`.
2. Include the bearer token in the HTTP `Authorization` request header:
   ```http
   Authorization: Bearer <your_jwt_access_token>
   ```

### User Roles & Permissions
- **`NURSE`**: Can record patient consent, submit intake cases, upload lab reports and voice notes, and view the triage queue.
- **`DOCTOR`**: Has all nurse privileges, plus the authority to accept, edit, or override clinical risk tags, view unredacted case details, and generate formal specialist referrals.
- **`ADMIN`**: User management, system configuration, and audit verification.

---

## Endpoint Summary Table

| Method | Endpoint Path | Description | Auth Required | Roles |
| :--- | :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/cases` | Create a new patient intake & clinical case | **Yes** | `NURSE`, `DOCTOR` |
| `POST` | `/api/v1/cases/{id}/report` | Upload a lab report or document image for OCR parsing | **Yes** | `NURSE`, `DOCTOR` |
| `POST` | `/api/v1/cases/{id}/voice` | Upload a vernacular audio voice note for Whisper STT | **Yes** | `NURSE`, `DOCTOR` |
| `GET` | `/api/v1/cases/{id}` | Retrieve comprehensive case details, vitals, and summary | **Yes** | `NURSE`, `DOCTOR` |
| `GET` | `/api/v1/queue` | Retrieve the prioritized clinical triage queue | **Yes** | `NURSE`, `DOCTOR` |
| `POST` | `/api/v1/review/{case_id}` | Submit clinician review (accept, edit, or override triage tag) | **Yes** | `DOCTOR` |
| `POST` | `/api/v1/referral/{case_id}` | Generate a structured bilingual referral document | **Yes** | `DOCTOR` |
| `GET` | `/api/v1/audit/{case_id}` | Retrieve the complete cryptographic audit trail for a case | **Yes** | `NURSE`, `DOCTOR`, `ADMIN` |
| `GET` | `/api/v1/audit/{case_id}/verify` | Verify the cryptographic integrity of the case's hash chain | **Yes** | `ADMIN`, `DOCTOR` |
| `POST` | `/api/v1/consent` | Record digital patient consent under DPDP Act 2023 | **No** | Public / Frontline |
| `POST` | `/api/v1/consent/auth/login` | Authenticate healthcare worker and issue JWT token | **No** | Public |
| `POST` | `/api/v1/consent/auth/register` | Register a new healthcare worker account | **No** / Admin | Public / Admin |
| `DELETE`| `/api/v1/cases/patients/{id}` | DPDP Right to Erasure: scrub patient PII | **Yes** | `ADMIN`, `DOCTOR` |
| `POST` | `/api/v1/webhooks/whatsapp` | Meta WhatsApp Cloud API webhook receiver | **No** | Verified via Token |
| `POST` | `/api/v1/webhooks/sms` | Twilio / SMS Gateway webhook receiver | **No** | Verified via Signature |
| `GET` | `/health` | System liveness probe and offline status check | **No** | Public |

---

## Detailed Endpoint Reference

### 1. Case Management

#### 1.1 Create Case
- **Method**: `POST`
- **Path**: `/api/v1/cases`
- **Description**: Creates a new triage case. Patient identity fields are isolated into the PII table, symptoms and vitals are processed against `risk_rules.yaml`, local LLM summarization is triggered, and a tamper-evident audit record is created.
- **Auth Required**: Yes (`NURSE`, `DOCTOR`)
- **Request Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "patient_name": "Ramesh Kumar",
    "patient_phone": "+919876543210",
    "abha_id": "14-1234-5678-9012",
    "facility_id": "PHC-RAMGARH-01",
    "symptoms": {
      "symptoms_text": "Severe retrosternal chest pain radiating to left arm, sweating, shortness of breath",
      "body_map_selections": ["chest", "arm_left"],
      "language": "hi",
      "age_years": 54,
      "gender": "male",
      "chest_pain_minutes": 45.0,
      "spo2_percent": 91.0,
      "bp_systolic": 165.0,
      "fever_duration_days": 0.0,
      "symptom_duration_hours": 2.0,
      "symptom_count": 3,
      "maternal_bleeding": 0,
      "prior_condition_flag": 1
    }
  }
  ```
- **Response Format**: `201 Created`
  ```json
  {
    "id": "c7a8b610-d8f9-4b6c-a81d-e0b2401f8931",
    "pseudonymous_id": "p-90f7284b-0182-411a-b33c",
    "status": "READY_FOR_REVIEW",
    "risk_tag": "RED",
    "rule_id": "R001",
    "rule_message": "Low oxygen saturation or prolonged chest pain reported.",
    "symptoms_text": "Severe retrosternal chest pain radiating to left arm, sweating, shortness of breath",
    "symptoms_structured": {
      "chest_pain_minutes": 45.0,
      "spo2_percent": 91.0,
      "bp_systolic": 165.0
    },
    "extracted_data": null,
    "llm_summary": "54-year-old male presenting with acute retrosternal chest pain lasting 45 minutes with radiation to the left arm, diaphoresis, and hypoxia (SpO2 91%). Findings are concerning for Acute Coronary Syndrome.",
    "follow_up_questions": [
      "Is the patient experiencing nausea or vomiting?",
      "Does the patient have a prior history of myocardial infarction or stent placement?",
      "Has any aspirin or sublingual nitrate been administered?"
    ],
    "facility_id": "PHC-RAMGARH-01",
    "language": "hi",
    "body_map_selections": ["chest", "arm_left"],
    "created_at": "2026-09-04T14:30:00Z",
    "updated_at": "2026-09-04T14:30:02Z"
  }
  ```

---

#### 1.2 Upload Lab Report (OCR)
- **Method**: `POST`
- **Path**: `/api/v1/cases/{id}/report`
- **Description**: Accepts an image file (PNG, JPG, JPEG) or PDF of a laboratory report, prescription, or vitals slip. The image is processed through Tesseract OCR to extract quantitative lab values (Hemoglobin, Platelets, Fasting Glucose, Creatinine) and re-evaluates risk rules.
- **Auth Required**: Yes (`NURSE`, `DOCTOR`)
- **Request Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Request Parameters**:
  - Path: `id` (string, UUID of the case)
  - Form field: `file` (binary file upload)
- **Response Format**: `200 OK`
  ```json
  {
    "case_id": "c7a8b610-d8f9-4b6c-a81d-e0b2401f8931",
    "ocr_status": "COMPLETED",
    "raw_text_sample": "COMPLETE BLOOD COUNT ... Hemoglobin: 6.8 g/dL ... Platelet Count: 85000 /mcL",
    "extracted_parameters": {
      "hemoglobin_g_dl": 6.8,
      "platelet_count": 85000,
      "critical_flag": true
    },
    "updated_risk_tag": "RED",
    "message": "Report processed successfully and rule R002 triggered for severe anemia."
  }
  ```

---

#### 1.3 Upload Voice Note (STT)
- **Method**: `POST`
- **Path**: `/api/v1/cases/{id}/voice`
- **Description**: Accepts an audio recording (WAV, MP3, M4A, WebM) recorded in the clinic. OpenAI Whisper transcribes the spoken symptoms into text, identifies the source language (e.g., Hindi, Bengali, Marathi), and appends the transcript to the case.
- **Auth Required**: Yes (`NURSE`, `DOCTOR`)
- **Request Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Request Parameters**:
  - Path: `id` (string, UUID of the case)
  - Form field: `audio` (binary audio file upload)
  - Form field: `language` (optional string, e.g. `hi`, `auto`)
- **Response Format**: `200 OK`
  ```json
  {
    "case_id": "c7a8b610-d8f9-4b6c-a81d-e0b2401f8931",
    "stt_status": "COMPLETED",
    "detected_language": "hi",
    "transcript": "मरीज को पिछले दो घंटे से सीने में बहुत तेज दर्द है और सांस लेने में तकलीफ हो रही है।",
    "translated_text": "The patient has had severe chest pain for the last two hours and difficulty breathing.",
    "message": "Voice note transcribed and clinical record updated."
  }
  ```

---

#### 1.4 Get Case Details
- **Method**: `GET`
- **Path**: `/api/v1/cases/{id}`
- **Description**: Retrieves full clinical and demographic information for a specific case, including body-map tags, OCR results, voice transcripts, LLM insights, and the audit trail.
- **Auth Required**: Yes (`NURSE`, `DOCTOR`)
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Parameters**:
  - Path: `id` (string, UUID of the case)
- **Response Format**: `200 OK`
  ```json
  {
    "id": "c7a8b610-d8f9-4b6c-a81d-e0b2401f8931",
    "pseudonymous_id": "p-90f7284b-0182-411a-b33c",
    "patient_name": "Ramesh Kumar",
    "patient_phone": "+919876543210",
    "age_years": 54,
    "gender": "male",
    "facility_id": "PHC-RAMGARH-01",
    "status": "READY_FOR_REVIEW",
    "risk_tag": "RED",
    "rule_id": "R001",
    "rule_message": "Low oxygen saturation or prolonged chest pain reported.",
    "symptoms_text": "Severe retrosternal chest pain radiating to left arm...",
    "body_map_selections": ["chest", "arm_left"],
    "voice_transcript": "मरीज को पिछले दो घंटे से सीने में बहुत तेज दर्द है...",
    "llm_summary": "54-year-old male presenting with acute retrosternal chest pain...",
    "follow_up_questions": [
      "Is the patient experiencing nausea or vomiting?",
      "Does the patient have a prior history of MI?"
    ],
    "created_at": "2026-09-04T14:30:00Z",
    "updated_at": "2026-09-04T14:30:02Z",
    "audit_trail": [
      {
        "id": 1,
        "action": "CASE_CREATED",
        "actor_id": 2,
        "created_at": "2026-09-04T14:30:00Z"
      },
      {
        "id": 2,
        "action": "RULES_EVALUATED",
        "actor_id": null,
        "created_at": "2026-09-04T14:30:01Z"
      }
    ]
  }
  ```

---

#### 1.5 Delete Patient Identity (DPDP Right to Erasure)
- **Method**: `DELETE`
- **Path**: `/api/v1/cases/patients/{id}`
- **Description**: Implements the "Right to Erasure" mandated by India's Digital Personal Data Protection (DPDP) Act 2023. Permanently deletes the patient's identity record (name, phone, ABHA ID) while preserving the anonymized clinical case record for epidemiological tracking.
- **Auth Required**: Yes (`ADMIN`, `DOCTOR`)
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Parameters**:
  - Path: `id` (integer or string, patient identity ID or case UUID)
- **Response Format**: `200 OK`
  ```json
  {
    "status": "success",
    "message": "Patient identity purged in compliance with DPDP Act. De-identified clinical case retained.",
    "patient_id": 42
  }
  ```

---

### 2. Triage Queue & Clinical Review

#### 2.1 Get Prioritized Triage Queue
- **Method**: `GET`
- **Path**: `/api/v1/queue`
- **Description**: Returns all unreviewed or in-progress cases for a health facility, automatically prioritized in descending order of clinical acuity (`RED` $\to$ `AMBER` $\to$ `GREEN`) and sorted by waiting time.
- **Auth Required**: Yes (`NURSE`, `DOCTOR`)
- **Request Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `facility_id` (optional string): Filter cases by specific clinic
  - `status` (optional string, default: `READY_FOR_REVIEW`)
- **Response Format**: `200 OK`
  ```json
  [
    {
      "id": "c7a8b610-d8f9-4b6c-a81d-e0b2401f8931",
      "pseudonymous_id": "p-90f7284b-0182-411a-b33c",
      "risk_tag": "RED",
      "rule_message": "Low oxygen saturation or prolonged chest pain reported.",
      "symptoms_text": "Severe retrosternal chest pain radiating to left arm...",
      "facility_id": "PHC-RAMGARH-01",
      "status": "READY_FOR_REVIEW",
      "created_at": "2026-09-04T14:30:00Z",
      "waiting_minutes": 14
    },
    {
      "id": "e4d1f2a3-9821-4f11-9a7c-33b5c19208a1",
      "pseudonymous_id": "p-22c19280-4921-41fa-bb19",
      "risk_tag": "AMBER",
      "rule_message": "Fever lasting 3+ days in a child under 5.",
      "symptoms_text": "High grade fever for 4 days, lethargy, poor oral intake",
      "facility_id": "PHC-RAMGARH-01",
      "status": "READY_FOR_REVIEW",
      "created_at": "2026-09-04T14:15:00Z",
      "waiting_minutes": 29
    }
  ]
  ```

---

#### 2.2 Review Case (Accept / Edit / Override)
- **Method**: `POST`
- **Path**: `/api/v1/review/{case_id}`
- **Description**: Submits the attending clinician's formal review decision. The clinician may accept the automated risk classification, edit details, or override the risk level. Overrides require mandatory explanation notes.
- **Auth Required**: Yes (`DOCTOR`)
- **Request Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Parameters**:
  - Path: `case_id` (string, UUID of the case)
- **Request Body**:
  ```json
  {
    "action": "override",
    "override_tag": "RED",
    "override_reason": "Patient is in severe respiratory distress despite borderline SpO2 reading of 93%. Immediate oxygenation and stabilization required.",
    "notes": "Administered 4L oxygen via nasal cannula. Transfer to District Hospital ordered."
  }
  ```
- **Response Format**: `200 OK`
  ```json
  {
    "case_id": "c7a8b610-d8f9-4b6c-a81d-e0b2401f8931",
    "status": "REVIEWED",
    "risk_tag": "RED",
    "reviewed_by": 1,
    "review_notes": "Administered 4L oxygen via nasal cannula. Transfer to District Hospital ordered.",
    "updated_at": "2026-09-04T14:45:00Z"
  }
  ```

---

#### 2.3 Generate Structured Referral
- **Method**: `POST`
- **Path**: `/api/v1/referral/{case_id}`
- **Description**: Generates an emergency referral document formatted for secondary or tertiary facilities (e.g., District Hospital or Medical College). Includes vitals, rule triggers, clinician notes, and transport priority.
- **Auth Required**: Yes (`DOCTOR`)
- **Request Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Parameters**:
  - Path: `case_id` (string, UUID of the case)
- **Request Body**:
  ```json
  {
    "target_facility": "District Hospital Hazaribagh",
    "transport_type": "108 Ambulance",
    "provisional_diagnosis": "Acute Coronary Syndrome (STEMI / NSTEMI)",
    "referral_reason": "Cardiac intensive care and urgent catheterization unavailable at PHC."
  }
  ```
- **Response Format**: `200 OK`
  ```json
  {
    "case_id": "c7a8b610-d8f9-4b6c-a81d-e0b2401f8931",
    "patient_pseudonymous_id": "p-90f7284b-0182-411a-b33c",
    "chief_complaint": "Severe retrosternal chest pain radiating to left arm",
    "symptom_timeline": "Onset 2 hours ago, acute onset during exertion",
    "vitals_summary": "BP: 165/100, SpO2: 91%, Pulse: 104 bpm",
    "ocr_lab_summary": "ECG shows ST elevation in leads V1-V4",
    "risk_tag": "RED",
    "rule_message": "Low oxygen saturation or prolonged chest pain reported.",
    "referral_reason": "Cardiac intensive care and urgent catheterization unavailable at PHC.",
    "generated_at": "2026-09-04T14:48:00Z"
  }
  ```

---

### 3. Cryptographic Audit Trail

#### 3.1 Get Case Audit Trail
- **Method**: `GET`
- **Path**: `/api/v1/audit/{case_id}`
- **Description**: Returns the chronological sequence of all logged actions associated with the specified case, including actor IDs, action timestamps, cryptographic hashes, and payload snapshots.
- **Auth Required**: Yes (`NURSE`, `DOCTOR`, `ADMIN`)
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Parameters**:
  - Path: `case_id` (string, UUID of the case)
- **Response Format**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "case_id": "c7a8b610-d8f9-4b6c-a81d-e0b2401f8931",
      "actor_id": 2,
      "action": "CASE_CREATED",
      "detail": {"status": "DRAFT", "language": "hi"},
      "previous_hash": null,
      "current_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "created_at": "2026-09-04T14:30:00Z"
    },
    {
      "id": 2,
      "case_id": "c7a8b610-d8f9-4b6c-a81d-e0b2401f8931",
      "actor_id": null,
      "action": "RULES_EVALUATED",
      "detail": {"rule_id": "R001", "risk_tag": "RED"},
      "previous_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "current_hash": "7a3511f98bc43d1a89c32b5001fa382901db876c543210fe91ab9823450912ab",
      "created_at": "2026-09-04T14:30:01Z"
    }
  ]
  ```

---

#### 3.2 Verify Audit Chain Integrity
- **Method**: `GET`
- **Path**: `/api/v1/audit/{case_id}/verify`
- **Description**: Recomputes all SHA-256 links sequentially across the audit ledger for the case to mathematically prove that no clinical records or triage outcomes have been retroactively modified or tampered with.
- **Auth Required**: Yes (`ADMIN`, `DOCTOR`)
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Parameters**:
  - Path: `case_id` (string, UUID of the case)
- **Response Format**: `200 OK`
  ```json
  {
    "valid": true,
    "entries_checked": 5,
    "broken_at": null,
    "message": "Cryptographic hash chain is valid. No data tampering detected."
  }
  ```

---

### 4. Consent & Authentication

#### 4.1 Record Patient Consent
- **Method**: `POST`
- **Path**: `/api/v1/consent`
- **Description**: Records digital consent obtained prior to processing patient health data. Captures language, timestamp, and client IP address.
- **Auth Required**: No
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "case_id": "c7a8b610-d8f9-4b6c-a81d-e0b2401f8931",
    "consented": true,
    "consent_language": "hi",
    "ip_address": "192.168.1.45"
  }
  ```
- **Response Format**: `200 OK`
  ```json
  {
    "status": "success",
    "consent_id": 18,
    "consented": true,
    "recorded_at": "2026-09-04T14:29:50Z"
  }
  ```

---

#### 4.2 Healthcare Worker Login
- **Method**: `POST`
- **Path**: `/api/v1/consent/auth/login`
- **Description**: Authenticates a Medical Officer or Staff Nurse using credentials and returns a signed JWT bearer token.
- **Auth Required**: No
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "username": "demo_doctor",
    "password": "demo123"
  }
  ```
- **Response Format**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "role": "DOCTOR"
  }
  ```

---

#### 4.3 Healthcare Worker Registration
- **Method**: `POST`
- **Path**: `/api/v1/consent/auth/register`
- **Description**: Registers a new healthcare worker account with an assigned facility and role.
- **Auth Required**: No (or Admin in production)
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "username": "nurse_sunita",
    "password": "SecurePassword123!",
    "email": "sunita.nurse@nhm.gov.in",
    "role": "NURSE",
    "facility_id": "PHC-RAMGARH-01"
  }
  ```
- **Response Format**: `201 Created`
  ```json
  {
    "status": "created",
    "user_id": 5,
    "username": "nurse_sunita",
    "role": "NURSE"
  }
  ```

---

### 5. Asynchronous Webhooks

#### 5.1 WhatsApp Webhook
- **Method**: `POST`
- **Path**: `/api/v1/webhooks/whatsapp`
- **Description**: Ingestion webhook receiving incoming messages, audio voice notes, and photo attachments from patients or ASHA workers via the Meta WhatsApp Cloud API.
- **Auth Required**: No (Meta Webhook verification token checked)
- **Request Headers**: `Content-Type: application/json`
- **Request Body**: Standard WhatsApp Cloud API webhook payload:
  ```json
  {
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {"phone_number_id": "100654321098765"},
              "messages": [
                {
                  "from": "919876543210",
                  "id": "wamid.HBgLM...",
                  "timestamp": "1757002800",
                  "text": {"body": "Mujhe 3 din se bukhar hai aur ulti ho rahi hai"},
                  "type": "text"
                }
              ]
            },
            "field": "messages"
          }
        ]
      }
    ]
  }
  ```
- **Response Format**: `200 OK`
  ```json
  {
    "status": "received",
    "processed_count": 1
  }
  ```

---

#### 5.2 SMS Webhook
- **Method**: `POST`
- **Path**: `/api/v1/webhooks/sms`
- **Description**: Ingestion webhook handling incoming SMS text messages forwarded from gateway providers (e.g., Twilio or CDAC Mobile Seva).
- **Auth Required**: No (Gateway signature verified)
- **Request Headers**: `Content-Type: application/x-www-form-urlencoded`
- **Request Body**:
  ```
  From=+919876543210&Body=TRIAGE+Child+age+3+fever+4+days+vomiting&MessageSid=SM123456789
  ```
- **Response Format**: `200 OK`
  ```xml
  <Response>
    <Message>SAHAYAK: Case received. Please report to PHC Ramgarh triage desk immediately.</Message>
  </Response>
  ```

---

### 6. System Health Check

#### 6.1 Health Probe
- **Method**: `GET`
- **Path**: `/health`
- **Description**: Verifies service liveness, database connectivity, and reports whether the backend is operating in edge offline mode or cloud connected mode.
- **Auth Required**: No
- **Response Format**: `200 OK`
  ```json
  {
    "status": "ok",
    "offline_mode": false
  }
  ```
