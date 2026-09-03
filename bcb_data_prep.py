import io
import os
import zipfile
import pandas as pd
import polars as pl
import requests
from datetime import datetime

PROCESSED_DIR = "data/processed"
PARQUET_FILE = os.path.join(PROCESSED_DIR, "bcb_credit_sample.parquet")

def _baixar_e_reduzir_ano(ano: int, chunksize: int = 100000) -> pd.DataFrame:
    url = f"https://www.bcb.gov.br/pda/desig/scrdata_{ano}.zip"
    print(f"📥 Baixando arquivo oficial do SCR.data (Ano: {ano})...")
    headers = {"User-Agent": "Mozilla/5.0"}
    resp = requests.get(url, headers=headers, stream=True, timeout=120)
    resp.raise_for_status()

    amostras_list = []
    with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
        arquivos_internos = [f for f in z.namelist() if f.endswith(".csv") or f.endswith(".txt")]
        if not arquivos_internos:
            raise FileNotFoundError(f"Nenhum arquivo CSV encontrado dentro do ZIP do BCB ({ano}).")
        for csv_filename in arquivos_internos:
            print(f" 📄 Extraindo arquivo interno: {csv_filename}")
            with z.open(csv_filename) as f:
                reader = pd.read_csv(f, sep=";", encoding="utf-8-sig", chunksize=chunksize, low_memory=False)
                for chunk in reader:
                    amostras_list.append(chunk.sample(frac=0.20, random_state=42))

    df = pd.concat(amostras_list, ignore_index=True)
    df.columns = df.columns.str.strip().str.lower()
    return df

def _estratificar_por_uf(df: pd.DataFrame, n_amostra_total: int) -> pd.DataFrame:
    col_uf = [c for c in df.columns if "uf" in c][0]
    frac_ajuste = min(1.0, n_amostra_total / len(df))
    df_final = (
        df.groupby(col_uf, group_keys=False)
        .apply(lambda x: x.sample(frac=frac_ajuste, random_state=42))
        .reset_index(drop=True)
    )
    if len(df_final) > n_amostra_total:
        df_final = df_final.sample(n=n_amostra_total, random_state=42).reset_index(drop=True)
    return df_final

def download_and_process():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    
    # Limpa arquivo parquet antigo para não acumular lixo na máquina/nuvem
    if os.path.exists(PARQUET_FILE):
        os.remove(PARQUET_FILE)

    hoje = datetime.now()
    cutoff = hoje - pd.DateOffset(months=12)
    anos_necessarios = sorted(set([cutoff.year, hoje.year]))

    frames_brutos = []
    for ano in anos_necessarios:
        try:
            frames_brutos.append(_baixar_e_reduzir_ano(ano))
        except Exception as e:
            print(f"Erro ao baixar o ano {ano}: {e}")
    
    if not frames_brutos:
        raise RuntimeError("Nenhum dos anos pôde ser baixado — verifique a conexão ou os URLs do BCB.")
    df_bruto = pd.concat(frames_brutos, ignore_index=True)

    df_bruto = pd.concat(frames_brutos, ignore_index=True)
    df_bruto["data_base"] = pd.to_datetime(df_bruto["data_base"], errors="coerce")
    df_bruto = df_bruto[df_bruto["data_base"] >= cutoff]

    # Amostra reduzida e garantida em 30.000 registros
    df_pandas = _estratificar_por_uf(df_bruto, n_amostra_total=30000)

    # Conversões monetárias e alvo
    for col in df_pandas.columns:
        if df_pandas[col].dtype == "object":
            amostra_val = df_pandas[col].dropna().iloc[0] if not df_pandas[col].dropna().empty else ""
            if isinstance(amostra_val, str) and "," in amostra_val:
                df_pandas[col] = df_pandas[col].astype(str).str.replace(".", "", regex=False).str.replace(",", ".", regex=False).astype(float)

    if "carteira_ativa" in df_pandas.columns:
        df_pandas = df_pandas[df_pandas["carteira_ativa"] > 10.0].copy()

    col_vencido = "vencido_acima_de_90_dias" if "vencido_acima_de_90_dias" in df_pandas.columns else "carteira_inadimplencia"
    df_pandas["target_default"] = ((df_pandas[col_vencido] / (df_pandas["carteira_ativa"] + 1e-5)) > 0.05).astype(int)

    df_polars = pl.from_pandas(df_pandas)
    df_polars.write_parquet(PARQUET_FILE)
    print(f"Sucesso! Amostra atualizada com {df_polars.height} registros (30k) salvos em {PARQUET_FILE}.")

if __name__ == "__main__":
    download_and_process()