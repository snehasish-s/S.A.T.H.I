import pytest

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_create_case(client):
    payload = {
        "patient_name": "Test Patient",
        "symptoms": {
            "symptoms_text": "Cough and fever",
            "spo2_percent": 88
        }
    }
    response = client.post("/api/v1/cases/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_tag"] == "RED"
    assert "id" in data

def test_get_case(client):
    payload = {
        "symptoms": {
            "symptoms_text": "Headache"
        }
    }
    create_resp = client.post("/api/v1/cases/", json=payload)
    case_id = create_resp.json()["id"]
    
    get_resp = client.get(f"/api/v1/cases/{case_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == case_id

def test_queue(client):
    response = client.get("/api/v1/queue/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_register_and_login(client):
    reg_payload = {
        "username": "testuser",
        "password": "testpassword123",
        "role": "NURSE"
    }
    reg_resp = client.post("/api/v1/consent/auth/register", json=reg_payload)
    assert reg_resp.status_code == 200
    assert "access_token" in reg_resp.json()
    
    login_payload = {
        "username": "testuser",
        "password": "testpassword123"
    }
    login_resp = client.post("/api/v1/consent/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()
