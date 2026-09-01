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
  # Valida o motor de decisão com a assinatura atual de parâmetros
  decisao = avaliar_proposta_credito(
      pd_score=0.05,
      renda_anual=60000.0,
      dividas_mensais=500.0,
      valor_solicitado=10000.0,
  )
  assert decisao["status"] == "APROVADO"
  assert decisao["risk_rating"] == "A"
  assert decisao["approved_limit"] > 0


def test_predict_endpoint():
  # Payload ajustado ao schema oficial do BACEN/FinSight
  payload = {
      "name": "Cliente Teste",
      "carteira_a_vencer": 15000.0,
      "a_vencer_ate_90_dias": 5000.0,
      "a_vencer_de_91_ate_360_dias": 10000.0,
      "numero_de_operacoes": 3,
      "requested_amount": 20000.0,
      "dividas_mensais": 1500.0,
      "modalidade": "Empréstimos",
      "porte": "Mais de 3 a 5 salários mínimos",
      "uf": "CE",
  }
  response = client.post("/predict", json=payload)
  assert response.status_code == 200
  data = response.json()
  assert "evaluation" in data
  assert data["evaluation"]["status"] in ["APROVADO", "RECUSADO"]