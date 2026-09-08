import joblib
import pandas as pd
import numpy as np

class CreditSimulator:
    def __init__(self, model_path="artifacts/champion_model.pkl", threshold=0.3814):
        self.pipeline = joblib.load(model_path)
        self.threshold = threshold

    def process_input(self, user_data: dict) -> pd.DataFrame:
        df = pd.DataFrame([user_data])
        df.columns = df.columns.str.strip().str.lower()
        
        # Engenharia de features avançada idêntica ao pipeline de treino
        if 'monthlydebtpayments' in df.columns and 'monthlyincome' in df.columns:
            df['comprometimento_renda'] = df['monthlydebtpayments'] / (df['monthlyincome'] + 1e-5)
        if 'totalassets' in df.columns and 'totalliabilities' in df.columns:
            df['patrimonio_liquido_calc'] = df['totalassets'] - df.get('totalliabilities', 0)
        if 'loanamount' in df.columns and 'annualincome' in df.columns:
            df['emprestimo_vs_renda_anual'] = df['loanamount'] / (df['annualincome'] + 1e-5)
        if 'savingsaccountbalance' in df.columns and 'checkingaccountbalance' in df.columns and 'monthlydebtpayments' in df.columns:
            soma_saldos = df['savingsaccountbalance'] + df['checkingaccountbalance']
            df['cobertura_liquidez'] = soma_saldos / (df['monthlydebtpayments'] + 1e-5)

        return df

    def simulate(self, user_data: dict) -> dict:
        df_processed = self.process_input(user_data)
        
        if hasattr(self.pipeline, "feature_names_in_") and self.pipeline.feature_names_in_ is not None:
            for col in self.pipeline.feature_names_in_:
                if col not in df_processed.columns:
                    df_processed[col] = 0.0
            df_processed = df_processed[self.pipeline.feature_names_in_]

        approval_prob = float(self.pipeline.predict_proba(df_processed)[:, 1][0])
        is_approved = approval_prob >= self.threshold

        if approval_prob >= 0.75:
            risk_level = "Baixo Risco"
        elif approval_prob >= self.threshold:
            risk_level = "Risco Moderado"
        else:
            risk_level = "Alto Risco"

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