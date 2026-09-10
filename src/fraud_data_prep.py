import os
import pandas as pd
import polars as pl
import requests

PROCESSED_DIR = "data/processed"
PARQUET_TRANS = os.path.join(PROCESSED_DIR, "pix_transacoes_sample.parquet")
PARQUET_FRAUD = os.path.join(PROCESSED_DIR, "pix_fraud_sample.parquet")

def fetch_bcb_pix_ecosystem():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    
    for f in [PARQUET_TRANS, PARQUET_FRAUD]:
        if os.path.exists(f):
            os.remove(f)

    headers = {"User-Agent": "Mozilla/5.0"}
    competencia = "202512"

    url_trans = f"https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/odata/EstatisticasTransacoesPix(Database=@Database)?@Database='{competencia}'&$format=json"
    print(f"Consultando Estatísticas Gerais de Transações Pix na API do BCB ({competencia})...")
    resp_trans = requests.get(url_trans, headers=headers, timeout=60)
    resp_trans.raise_for_status()
    data_trans = resp_trans.json().get("value", [])
    
    df_trans = pd.DataFrame(data_trans)
    df_trans.columns = df_trans.columns.str.strip().str.lower()
    
    MAX_AMOSTRA = 30000
    if len(df_trans) > MAX_AMOSTRA:
        print(f"Aplicando amostragem estratificada proporcional para limitar a {MAX_AMOSTRA} registros...")
        coluna_estrato = 'finalidade' if 'finalidade' in df_trans.columns else df_trans.columns[0]
        df_trans = df_trans.groupby(coluna_estrato, group_keys=False).apply(
            lambda x: x.sample(n=max(1, int(len(x) / len(df_trans) * MAX_AMOSTRA)), random_state=42)
        )

    url_fraud = f"https://olinda.bcb.gov.br/olinda/servico/Pix_DadosAbertos/versao/v1/odata/EstatisticasFraudesPix(Database=@Database)?@Database='{competencia}'&$format=json"
    print(f"Consultando Estatísticas de Fraudes e MED Pix na API do BCB ({competencia})...")
    resp_fraud = requests.get(url_fraud, headers=headers, timeout=60)
    resp_fraud.raise_for_status()
    data_fraud = resp_fraud.json().get("value", [])
    
    df_fraud = pd.DataFrame(data_fraud)
    df_fraud.columns = df_fraud.columns.str.strip().str.lower()

    pl.from_pandas(df_trans).write_parquet(PARQUET_TRANS)
    pl.from_pandas(df_fraud).write_parquet(PARQUET_FRAUD)
    
    print(f"Dados otimizados salvos ({len(df_trans)} registros de transações e {len(df_fraud)} de fraudes).")

if __name__ == "__main__":
    fetch_bcb_pix_ecosystem()