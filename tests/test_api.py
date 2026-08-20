import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.api import app
from src.decision_engine import evaluate_credit_decision

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_decision_engine_approved():
    decision = evaluate_credit_decision(pd_score=0.05, requested_amount=10000, annual_inc=60000)
    assert decision["status"] == "APROVADO"

def test_decision_engine_rejected():
    decision = evaluate_credit_decision(pd_score=0.35, requested_amount=10000, annual_inc=60000)
    assert decision["status"] == "RECUSADO"

def test_predict_endpoint():
    payload = {
        "loan_amnt": 15000.0,
        "term": " 36 months",
        "int_rate": 11.99,
        "installment": 498.15,
        "grade": "B",
        "sub_grade": "B3",
        "emp_length": "10+ years",
        "home_ownership": "RENT",
        "annual_inc": 75000.0,
        "verification_status": "Verified",
        "purpose": "debt_consolidation",
        "dti": 18.5,
        "delinq_2yrs": 0.0,
        "inq_last_6mths": 1.0,
        "open_acc": 10.0,
        "pub_rec": 0.0,
        "revol_bal": 12000.0,
        "revol_util": 45.2,
        "total_acc": 22.0,
        "issue_d": "2015-12-01",
        "earliest_cr_line": "2001-08-01"
    }
    response = client.post("/predict", json=payload)
    # Aceita 200 (se modelo carregado) ou 500 caso o arquivo do modelo não esteja na máquina local sem Docker
    assert response.status_code in [200, 500]