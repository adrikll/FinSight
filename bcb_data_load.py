import os
import pandas as pd
import psycopg2
from src.config import POSTGRES_URL

PARQUET_PATH = "data/processed/bcb_credit_sample.parquet"

def carregar_carteira_historica():
    if not os.path.exists(PARQUET_PATH):
        print(f"Arquivo {PARQUET_PATH} não encontrado.")
        return

    df = pd.read_parquet(PARQUET_PATH)
    print("Colunas disponíveis no Parquet:", df.columns.tolist())
    df.columns = df.columns.str.replace("ï»¿", "", regex=False).str.strip().str.lower()

    conn = psycopg2.connect(POSTGRES_URL)
    cur = conn.cursor()

    records = []
    for _, row in df.iterrows():
        data_base_raw = pd.to_datetime(row.get("data_base"), errors="coerce")
        data_base_val = data_base_raw.date() if pd.notna(data_base_raw) else None

        records.append((
            data_base_val,
            str(row.get("uf", "")),
            str(row.get("segmento", "")),
            str(row.get("cliente", "")),
            str(row.get("cnae_ocupacao", "")),
            str(row.get("porte", "")),
            str(row.get("modalidade", "")),
            str(row.get("submodalidade", "")),
            str(row.get("origem", "")),
            str(row.get("indexador", "")),
            int(row.get("numero_de_operacoes", 0)),
            float(row.get("carteira_a_vencer", 0.0)),
            float(row.get("vencido_de_15_ate_90_dias", 0.0)),
            float(row.get("vencido_acima_de_90_dias", 0.0)),
            float(row.get("carteira_vencida", 0.0)),
            float(row.get("carteira_ativa", 0.0)),
            float(row.get("carteira_inadimplencia", 0.0)),
            float(row.get("ativo_problematico", 0.0)),
        ))

    # LIMPEZA OBRIGATÓRIA: Apaga todo o histórico anterior no Azure antes de inserir a nova safra
    print("Limpando dados antigos no PostgreSQL do Azure...")
    cur.execute("TRUNCATE TABLE carteira_bcb_historica RESTART IDENTITY;")

    print("Inserindo nova safra atualizada (últimos 12 meses)...")
    cur.executemany("""
        INSERT INTO carteira_bcb_historica (
            data_base, uf, segmento, cliente, cnae_ocupacao, porte, modalidade,
            submodalidade, origem, indexador, numero_de_operacoes, carteira_a_vencer,
            vencido_de_15_ate_90_dias, vencido_acima_de_90_dias, carteira_vencida,
            carteira_ativa, carteira_inadimplencia, ativo_problematico
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, records)
    
    conn.commit()
    cur.close()
    conn.close()
    print(f"✅ Banco no Azure atualizado com sucesso! Total de {len(records)} registros mantidos.")

if __name__ == "__main__":
    carregar_carteira_historica()