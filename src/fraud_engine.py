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
    """
    Avalia o risco de fraude/anomalia combinando Isolation Forest com regras de negócio.
    """
    flags = []
    
    # Regra de Consistência: Renda inconsistente com o valor solicitado
    monthly_income = annual_inc / 12 if annual_inc > 0 else 1.0
    if loan_amnt > (annual_inc * 1.5):
        flags.append("Valor solicitado excede 150% da renda anual declarada.")
    
    if monthly_debts > (monthly_income * 0.9):
        flags.append("Gastos mensais declarados consomem mais de 90% da renda mensal.")

    # Detecção de Anomalia via Isolation Forest
    X_sample = np.array([[loan_amnt, annual_inc, monthly_debts]])
    anomaly_score = float(_fraud_detector.score_samples(X_sample)[0]) # Quanto menor, mais anômalo
    
    # Normalização simples do score para percentual (0 a 100%)
    fraud_score = round(max(0, min(100, (0.5 - anomaly_score) * 100)), 2)
    
    is_suspicious = len(flags) > 0 or fraud_score > 60.0

    return {
        "fraud_score": fraud_score,
        "is_suspicious": is_suspicious,
        "flags": flags,
        "recommendation": "BLOQUEAR / REVISÃO MANUAL DE FRAUDE" if is_suspicious else "TRANSAÇÃO NORMAL"
    }