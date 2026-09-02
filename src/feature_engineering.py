import numpy as np
import pandas as pd

def feature_engineering_avancada(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df.columns = df.columns.str.strip().str.lower()

    # --- REMOÇÃO RÍGIDA DE VARIÁVEIS DE BIRÔ, HISTÓRICO EXTERNO E PÓS-ANÁLISE ---
    # Mantendo apenas o que o usuário efetivamente preenche no formulário de simulação cadastral.
    drop_features = [
        "applicationdate", "creditscore", "bankruptcyhistory", "previousloandefaults", 
        "paymenthistory", "lengthofcredithistory", "numberofopencreditlines", 
        "numberofcreditinquiries", "debttoincomeratio", "totaldebttoincomeratio",
        "baseinterestrate", "interestrate", "monthlyloanpayment", "riskscore",
        "loanapproved", "loan_approved", "loan_status"
    ]
    df.drop(columns=[c for c in drop_features if c in df.columns], inplace=True, errors="ignore")

    # Tratamento de colunas numéricas essenciais informadas pelo usuário
    num_cols = ["age", "annualincome", "experience", "loanamount", "loanduration", 
                "numberofdependents", "monthlydebtpayments", "creditcardutilizationrate",
                "savingsaccountbalance", "checkingaccountbalance", "totalassets", 
                "totalliabilities", "monthlyincome", "jobtenure", "networth"]
    
    for col in num_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    # Engenharia de capacidade financeira baseada exclusivamente em dados cadastrais e informados
    if "annualincome" in df.columns and "loanamount" in df.columns:
        df["loan_to_income"] = df["loanamount"] / (df["annualincome"] + 1.0)
        df["log_income"] = np.log1p(df["annualincome"])
        df["log_loan"] = np.log1p(df["loanamount"])

    if "experience" in df.columns and "age" in df.columns:
        df["career_stability_ratio"] = df["experience"] / (df["age"] + 1.0)

    # Limpeza de colunas categóricas / textuais
    str_cols = df.select_dtypes(include=["object", "category"]).columns
    for col in str_cols:
        df[col] = df[col].astype(str).str.strip().str.lower()

    return df