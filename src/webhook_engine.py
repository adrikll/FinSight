import logging
import requests
from datetime import datetime, timezone
from src.config import get_secret

def get_webhook_url() -> str:
    """Busca a URL do Webhook dinamicamente do Key Vault ou .env."""
    return get_secret("POWER-AUTOMATE-WEBHOOK-URL", "POWER_AUTOMATE_WEBHOOK_URL", "")

def send_risk_alert(application_data: dict) -> bool:
    """
    Envia um payload resumido com os detalhes da proposta para o Power Automate
    quando há recusa ou necessidade de análise de risco.
    """
    url = get_webhook_url()
    if not url:
        logging.warning("POWER_AUTOMATE_WEBHOOK_URL não configurada. Alerta não enviado.")
        return False

    payload = {
        "event_type": "CREDIT_DECISION_ALERT",
        "customer_id": application_data.get("customer_id"),
        "requested_amount": application_data.get("requested_amount"),
        "pd_score": application_data.get("pd_score"),
        "risk_rating": application_data.get("risk_rating"),
        "status": application_data.get("status"),
        "decision_reason": application_data.get("decision_reason")
    }

    try:
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code in [200, 201, 202]:
            logging.info("Alerta enviado ao Power Automate com sucesso!")
            return True
        else:
            logging.error(f"Falha ao enviar alerta. Status: {response.status_code}")
            return False
    except Exception as e:
        logging.error(f"Erro ao disparar webhook: {e}")
        return False

def dispatch_webhook_event(event_type: str, payload: dict, decision_result: dict) -> bool:
    """
    Dispara notificações de webhook completas e assíncronas para o Power Automate / CRM / RPA.
    """
    url = get_webhook_url()
    if not url:
        logging.warning(f"URL do Webhook não configurada. Evento [{event_type}] não disparado.")
        return False

    event_packet = {
        "event_id": f"evt_{int(datetime.now(timezone.utc).timestamp())}",
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": {
            "application_data": payload,
            "decision": decision_result
        }
    }

    try:
        logging.info(f"Disparando Webhook [{event_type}]...")
        response = requests.post(
            url,
            json=event_packet,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        logging.info(f"Webhook entregue com sucesso! Status Code: {response.status_code}")
        return response.status_code in [200, 201, 202]
    except Exception as err:
        logging.error(f"Falha ao entregar Webhook [{event_type}]: {str(err)}")
        return False