import requests

def obter_taxa_selic_atual() -> float:
    try:
        url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            return float(resp.json()[0]["valor"]) / 100.0
    except Exception:
        pass
    return 0.1175  # Fallback: 11.75% a.a.

def avaliar_proposta_credito(
    pd_score: float,
    income: float = 60000.0,
    monthly_debt: float = 0.0,
    loan_amount: float = 10000.0,
    **kwargs,
):
    selic = obter_taxa_selic_atual()
    renda_mensal = income / 12.0

    # Hard Rule: Endividamento mensal superior ou igual à renda
    if monthly_debt >= renda_mensal:
        return {
            "status": "RECUSADO",
            "pd_score": round(pd_score, 4),
            "risk_rating": "F",
            "approved_limit": 0.0,
            "suggested_rate_annual": 0.0,
            "decision_reason": "Proposta recusada: As despesas mensais comprometem integralmente a renda informada.",
        }

    # Definição do Rating de Risco com base na Probabilidade de Default (PD)
    if pd_score <= 0.10:
        rating, spread = "A", 0.03
    elif pd_score <= 0.25:
        rating, spread = "B", 0.06
    elif pd_score <= 0.45:
        rating, spread = "C", 0.10
    elif pd_score <= 0.70:
        rating, spread = "D", 0.16
    else:
        rating, spread = "F", 0.25

    if pd_score > 0.70:
        return {
            "status": "RECUSADO",
            "pd_score": round(pd_score, 4),
            "risk_rating": rating,
            "approved_limit": 0.0,
            "suggested_rate_annual": 0.0,
            "decision_reason": f"Risco inadmissível (Score de crédito incompatível com a política de concessão).",
        }

    # Cálculo da capacidade de pagamento (Margem de 30% da renda líquida)
    capacidade_parcela = max(0.0, (renda_mensal * 0.30) - monthly_debt)
    limite_calculado = min(loan_amount, capacidade_parcela * 24.0)

    if limite_calculado < 500.0:
        status = "RECUSADO"
        limite_aprovado = 0.0
        taxa_sugerida = 0.0
        motivo = "Comprometimento de renda elevado para o valor solicitado."
    else:
        status = "APROVADO"
        limite_aprovado = round(limite_calculado, 2)
        taxa_sugerida = round((selic + spread) * 100, 2)
        motivo = f"Proposta aprovada no Rating {rating} com base na análise de capacidade financeira."

    return {
        "status": status,
        "pd_score": round(pd_score, 4),
        "risk_rating": rating,
        "approved_limit": limite_aprovado,
        "suggested_rate_annual": taxa_sugerida,
        "decision_reason": motivo,
    }

evaluate_credit_decision = avaliar_proposta_credito