def determine_next_best_action(annual_inc: float, pd_score: float, status: str, dti: float) -> dict:
    """
    Motor de Recomendação (Next Best Action - NBA)
    Aplica regras de negócio sobre o perfil 360 para decidir o próximo passo comercial ou operacional.
    """
    #Risco Muito Alto / Recusado
    if status == "RECUSADO" or pd_score > 35.0:
        if dti > 40.0:
            return {
                "category": "Intervenção Financeira",
                "action": "Consultoria de Reorganização de Dívidas",
                "description": "Cliente apresenta alto estresse financeiro (DTI elevado). Oferecer renegociação de passivos antes de novas concessões."
            }
        return {
            "category": "Gerenciamento de Risco",
            "action": "Monitoramento Preventivo",
            "description": "Proposta recusada devido à alta probabilidade de default. Manter em régua de acompanhamento e reavaliar em 90 dias."
        }

    #Perfil Premium / Baixo Risco
    if pd_score <= 10.0 and annual_inc >= 60000:
        return {
            "category": "Cross-sell",
            "action": "Oferta Cartão Black + Carteira de Investimentos",
            "description": "Cliente de altíssima elegibilidade e baixo risco. Recomendar upgrade de categoria e produtos de renda fixa."
        }

    #Risco Moderado / Aprovado
    if status == "APROVADO":
        return {
            "category": "Upsell",
            "action": "Ofertar Seguro de Proteção Financeira",
            "description": "Crédito aprovado. Apresentar seguro prestamista integrado às parcelas do contrato para mitigar risco."
        }

    #Padrão
    return {
        "category": "Engajamento",
        "action": "Manutenção de Relacionamento",
        "description": "Oferecer conteúdos de educação financeira e serviços de conta corrente sem tarifa."
    }