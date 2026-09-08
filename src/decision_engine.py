import requests

def obter_taxa_selic_atual() -> float:
    try:
        url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            return float(resp.json()[0]["valor"]) / 100.0
    except Exception:
        pass
    return 0.1175 

def avaliar_proposta_credito(pd_score: float, renda_mensal: float, valor_solicitado: float, threshold: float = 0.3814):
    """
    Motor de Decisão e Explicabilidade baseado na probabilidade do Ensemble campeão.
    """
    is_approved = pd_score >= threshold
    
    if pd_score >= 0.75:
        risk_rating = "Baixo Risco"
    elif pd_score >= threshold:
        risk_rating = "Risco Moderado"
    else:
        risk_rating = "Alto Risco"

    comprometimento = valor_solicitado / (renda_mensal * 12 + 1e-8)
    
    reasons = []
    if is_approved:
        reasons.append("Seu perfil financeiro e estabilidade cadastral alinham-se positivamente com nossa política de crédito.")
        if comprometimento > 0.4:
            reasons.append("Atenção: O valor solicitado compromete uma fatia considerável da sua renda anual projetada.")
        else:
            reasons.append("Excelente proporção entre o valor solicitado e sua capacidade de renda.")
        status = "APROVADO"
        approved_limit = valor_solicitado
        suggested_rate = 18.5
    else:
        status = "NEGADO"
        approved_limit = 0.0
        suggested_rate = 0.0
        if comprometimento > 0.5:
            reasons.append("O valor pretendido excede o limite recomendado de alavancagem para a renda declarada.")
        else:
            reasons.append("O escore de risco cadastral calculado ficou abaixo do limiar mínimo de segurança (38.14%).")
        reasons.append("Sugestão: Tente reduzir o valor do empréstimo ou declarar ativos adicionais para uma nova simulação.")

    return {
        "status": status,
        "risk_rating": risk_rating,
        "approval_probability": round(pd_score * 100, 2),
        "approved_limit": approved_limit,
        "suggested_rate_annual": suggested_rate,
        "decision_reason": " ".join(reasons)
    }

evaluate_credit_decision = avaliar_proposta_credito