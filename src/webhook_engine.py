import requests
import os
import json
from datetime import datetime

# URL do receptor do Webhook
WEBHOOK_RECEIVER_URL = os.getenv("WEBHOOK_RECEIVER_URL", "http://localhost:8000/webhooks/receiver-mock")

def dispatch_webhook_event(event_type: str, payload: dict, decision_result: dict):
    """
    Dispara notificações de webhook assíncronas para sistemas externos (Power Automate / CRM / RPA).
    """
    event_packet = {
        "event_id": f"evt_{int(datetime.utcnow().timestamp())}",
        "event_type": event_type,
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "application_data": payload,
            "decision": decision_result
        }
    }

    try:
        print(f"Disparando Webhook [{event_type}] para {WEBHOOK_RECEIVER_URL}...")
        response = requests.post(
            WEBHOOK_RECEIVER_URL,
            json=event_packet,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        print(f"Webhook entregue com sucesso! Status Code: {response.status_code}")
    except Exception as err:
        print(f"Falha ao entregar Webhook [{event_type}]: {str(err)}")