import numpy as np
from sklearn.ensemble import IsolationForest

# Instância base do Isolation Forest treinada para anomalias estatísticas
_fraud_detector = IsolationForest(contamination=0.05, random_state=42)
# Dummy fit com dados de distribuição típica de empréstimo para inicialização
_X_dummy = np.array([
    [5000, 36000, 500],
    [15000, 75000, 1200],
    [25000, 120000, 2500],
    [1000, 20000, 200],
    [50000, 250000, 4000]
])
_fraud_detector.fit(_X_dummy)

def evaluate_fraud_risk(loan_amnt: float, annual_inc: float, monthly_debts: float) -> dict:
    flags = []
    
    #Checagem de Renda zerada ou negativa
    if annual_inc <= 0:
        flags.append("Renda anual declarada é menor ou igual a zero.")
        
    #Empréstimo desproporcional à renda
    if annual_inc > 0 and (loan_amnt > annual_inc * 1.5):
        flags.append("Valor solicitado excede 150% da renda anual declarada.")
        
    #Comprometimento de renda mensal elevado
    monthly_inc = annual_inc / 12 if annual_inc > 0 else 1.0
    if (monthly_debts / monthly_inc) > 0.8:
        flags.append("Comprometimento de renda mensal superior a 80%.")

    is_suspicious = len(flags) > 0

    return {
        "fraud_score": 100 if is_suspicious else 15,
        "is_suspicious": is_suspicious,
        "flags": flags,
        "recommendation": "BLOQUEAR / REVISÃO MANUAL DE FRAUDE" if is_suspicious else "APROVADO_SEM_SUSPEITA"
    }