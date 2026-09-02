import os
import glob
import pandas as pd
import kagglehub

def carregar_dataset_loan():
    """
    Baixa e carrega o dataset 'Financial Risk for Loan Approval' via kagglehub,
    substituindo qualquer versão anterior na pasta de processados.
    """
    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("data/processed", exist_ok=True)
    
    processed_path = "data/processed/loan_approval_data.csv"

    print("Baixando o dataset Financial Risk for Loan Approval via kagglehub...")
    path = kagglehub.dataset_download("lorenzozoppelletto/financial-risk-for-loan-approval")
    print(f"Path to dataset files: {path}")

    csv_files = glob.glob(os.path.join(path, "**/*.csv"), recursive=True)
    if not csv_files:
        raise FileNotFoundError("Nenhum arquivo CSV foi encontrado no diretório baixado pelo kagglehub.")

    raw_file_path = csv_files[0]
    print(f"✅ Lendo dados brutos de: {raw_file_path}")
    
    df = pd.read_csv(raw_file_path)

    # Padronização dos nomes das colunas
    df.columns = [str(c).strip().lower() for c in df.columns]

    target_col = "loanapproved"
    if target_col in df.columns:
        df['loan_status'] = pd.to_numeric(df[target_col], errors="coerce").fillna(0).astype(int)
    else:
        raise KeyError(f"A coluna alvo '{target_col}' não foi encontrada no dataset.")

    df.to_csv(processed_path, index=False)
    print(f"✅ Dataset carregado, processado e substituído com sucesso em: {processed_path}")
    return df

if __name__ == "__main__":
    carregar_dataset_loan()