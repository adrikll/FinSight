def evaluate_credit_decision(pd_score: float, requested_amount: float, annual_inc: float) -> dict:
    # Definição de limites e regras de corte
    MAX_PD_ALLOWED = 0.25  
    
    # Classificação do Rating
    if pd_score <= 0.05:
        rating = "A"
    elif pd_score <= 0.10:
        rating = "B"
    elif pd_score <= 0.18:
        rating = "C"
    elif pd_score <= 0.25:
        rating = "D"
    else:
        rating = "E"

    # Avaliação do Crédito
    if pd_score > MAX_PD_ALLOWED:
        return {
            "status": "RECUSADO",
            "rating": rating,
            "pd_score": round(pd_score * 100, 2),
            "approved_limit": 0,
            "suggested_rate": 0.0,
            "decision_reason": f"Probabilidade de default ({pd_score*100:.1f}%) excede a tolerância máxima ({MAX_PD_ALLOWED*100:.1f}%)."
        }

    # Se aprovado, calcular limite e taxa sugerida
    max_capacity = (annual_inc * 0.35)  # 35% da renda anual
    approved_limit = min(requested_amount, max_capacity)
    suggested_rate = round(12.5 + (pd_score * 40), 2)  # Taxa proporcional ao risco

    return {
        "status": "APROVADO",
        "rating": rating,
        "pd_score": round(pd_score * 100, 2),
        "approved_limit": round(approved_limit, 2),
        "suggested_rate": suggested_rate,
        "decision_reason": "Solicitação aprovada dentro dos parâmetros de risco da política de crédito."
    }