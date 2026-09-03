import joblib
import pandas as pd
import numpy as np

class CreditSimulator:
    def __init__(self, model_path="artifacts/champion_model.pkl", threshold=0.5329):
        self.pipeline = joblib.load(model_path)
        self.threshold = threshold

    def process_input(self, user_data: dict) -> pd.DataFrame:
        df = pd.DataFrame([user_data])
        df.columns = df.columns.str.strip().str.lower()
        
        # Engenharia de features em tempo de inferência
        if "annualincome" in df.columns and "loanamount" in df.columns:
            df["loan_to_income"] = df["loanamount"] / (df["annualincome"] + 1.0)
            df["log_income"] = np.log1p(df["annualincome"])
            df["log_loan"] = np.log1p(df["loanamount"])

        if "experience" in df.columns and "age" in df.columns:
            df["career_stability_ratio"] = df["experience"] / (df["age"] + 1.0)

        return df

    def simulate(self, user_data: dict) -> dict:
        df_processed = self.process_input(user_data)
        
        # Probabilidade de aprovação (classe 1)
        approval_prob = float(self.pipeline.predict_proba(df_processed)[:, 1][0])
        is_approved = approval_prob >= self.threshold

        # Classificação de Risco baseada na probabilidade
        if approval_prob >= 0.75:
            risk_level = "Baixo Risco"
        elif approval_prob >= self.threshold:
            risk_level = "Risco Moderado"
        else:
            risk_level = "Alto Risco"

        # Análise explicativa dos fatores com base nas features de maior peso
        factors = []
        loan_to_inc = user_data.get("loanamount", 0) / (user_data.get("annualincome", 1) + 1)
        if loan_to_inc > 0.4:
            factors.append("O valor do empréstimo solicitado representa uma fatia alta em relação à sua renda anual.")
        if user_data.get("monthlydebtpayments", 0) > (user_data.get("monthlyincome", 0) * 0.3):
            factors.append("Seu comprometimento atual com outras dívidas mensais está elevado.")
        if not factors:
            factors.append("Seu perfil financeiro e estabilidade cadastral alinham-se positivamente com nossa política de crédito.")

        return {
            "approved": is_approved,
            "approval_probability": round(approval_prob * 100, 2),
            "risk_level": risk_level,
            "threshold_used": self.threshold,
            "explanation": factors
        }