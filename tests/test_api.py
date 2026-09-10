from fastapi.testclient import TestClient
from src.api import app
from src.decision_engine import avaliar_proposta_credito

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"
    assert response.json()["model_loaded"] is True

def test_decision_engine_approved():
    decisao = avaliar_proposta_credito(
        pd_score=0.05,
        income=80000.0,
        monthly_debt=400.0,
        loan_amount=15000.0,
    )
    assert decisao["status"] == "APROVADO"
    assert decisao["risk_rating"] == "A"
    assert decisao["approved_limit"] > 0

def test_predict_endpoint():
    # Payload
    payload = {
        "name": "Cliente Teste",
        "age": 32,
        "income": 75000.0,
        "employment_status": "Empregado",
        "loan_amount": 20000.0,
        "loan_term": 24,
        "monthly_debt": 800.0,
        "dependents": 1
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "evaluation" in data
    assert data["evaluation"]["status"] in ["APROVADO", "RECUSADO"]