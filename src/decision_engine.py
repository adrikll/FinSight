import pandas as pd
import requests

def obter_taxa_selic_atual() -> float:
    """Consulta a taxa Selic anualizada oficial via API do SGS (Sistema Gerenciador de Séries Temporais) do BCB."""
    try:
        url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            dados = resp.json()
            return float(dados[0]["valor"]) / 100.0
    except Exception:
        pass
    return 0.1175  # Fallback: 11.75% a.a.

def avaliar_proposta_credito(
    pd_score: float,
    renda_anual: float = None,
    dividas_mensais: float = 0.0,
    valor_solicitado: float = 0.0,
    **kwargs,
):
    # Suporte a argumentos legados se fornecidos via kwargs
    if renda_anual is None:
        renda_anual = kwargs.get("annual_inc", 24000.0)
    if valor_solicitado == 0.0:
        valor_solicitado = kwargs.get("requested_amount", 10000.0)

    selic = obter_taxa_selic_atual()
    renda_mensal = renda_anual / 12.0

    # --- REGRA DE CORTE DE SEGURANÇA (Hard Rule) ---
    # Se as despesas mensais forem iguais ou maiores que a renda mensal, recusa imediata por endividamento excessivo.
    if dividas_mensais >= renda_mensal:
        return {
            "status": "RECUSADO",
            "pd_score": round(pd_score, 4),
            "risk_rating": "F",
            "approved_limit": 0.0,
            "suggested_rate_annual": 0.0,
            "decision_reason": "Proposta recusada: As despesas mensais informadas igualam ou superam a renda do cliente, indicando endividamento crítico.",
        }
    # -----------------------------------------------

    if pd_score <= 0.10:
        rating, spread = "A", 0.03
    elif pd_score <= 0.25:
        rating, spread = "B", 0.06
    elif pd_score <= 0.45:
        rating, spread = "C", 0.10
    elif pd_score <= 0.6954:
        rating, spread = "D", 0.16
    else:
        rating, spread = "F", 0.25

    if pd_score > 0.6954:
        status = "RECUSADO"
        taxa_sugerida = 0.0
        limite_aprovado = 0.0
        motivo = f"Risco inadmissível (PD de {pd_score*100:.1f}% excede o limite regulatório da política)."
    else:
        # Capacidade de pagamento real considerando a margem de 30% da renda menos as dívidas
        capacidade_parcela = max(0.0, (renda_mensal * 0.30) - (dividas_mensais * 0.20))
        limite_calculado = min(valor_solicitado, capacidade_parcela * 24.0)

        if limite_calculado < 1000.0:
            status = "RECUSADO"
            taxa_sugerida = 0.0
            limite_aprovado = 0.0
            motivo = "Comprometimento de renda elevado para concessão do limite mínimo."
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