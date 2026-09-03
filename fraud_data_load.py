import os
import pandas as pd
import psycopg2
from src.config import POSTGRES_URL

PARQUET_TRANS = "data/processed/pix_transacoes_sample.parquet"
PARQUET_FRAUD = "data/processed/pix_fraud_sample.parquet"

def carregar_dados_pix():
    conn = psycopg2.connect(POSTGRES_URL)
    cur = conn.cursor()

    print("Limpando dados antigos no PostgreSQL para evitar estouro de espaço...")
    cur.execute("TRUNCATE TABLE pix_transacoes_historica RESTART IDENTITY;")
    cur.execute("TRUNCATE TABLE pix_fraudes_historica RESTART IDENTITY;")
    conn.commit()

    if os.path.exists(PARQUET_TRANS):
        df_trans = pd.read_parquet(PARQUET_TRANS)
        rec_trans = [
            (
                int(r.get("anomes", 0)),
                str(r.get("pag_pfpj", "")),
                str(r.get("rec_pfpj", "")),
                str(r.get("pag_regiao", "")),
                str(r.get("rec_regiao", "")),
                str(r.get("pag_idade", "")),
                str(r.get("rec_idade", "")),
                str(r.get("formainiciacao", "")),
                str(r.get("natureza", "")),
                str(r.get("finalidade", "")),
                float(r.get("valor", 0.0)),
                int(r.get("quantidade", 0))
            )
            for _, r in df_trans.iterrows()
        ]
        cur.executemany("""
            INSERT INTO pix_transacoes_historica (
                anomes, pag_pfpj, rec_pfpj, pag_regiao, rec_regiao, 
                pag_idade, rec_idade, formainiciacao, natureza, finalidade, valor, quantidade
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, rec_trans)
        print(f"✅ {len(rec_trans)} registros de transações gerais Pix inseridos (amostra representativa).")

    if os.path.exists(PARQUET_FRAUD):
        df_fraud = pd.read_parquet(PARQUET_FRAUD)
        rec_fraud = [
            (
                int(r.get("anomes", 0)), 
                int(r.get("qtdepixcontestados", 0)), 
                int(r.get("qtdecontestacoesaceitas", 0)),
                int(r.get("qtdecontestacoesrejeitadas", 0)), 
                float(r.get("qtdecontestacoesaceitasacada100mil", 0.0)),
                int(r.get("qtdeusuarioscommarcacoesdefraude", 0)), 
                int(r.get("qtdechavespixcommarcacoesdefraude", 0)),
                float(r.get("valorpixcontestadosaceitos", 0.0)), 
                int(r.get("quantidadedevolvidaintegralmentepormeiodomed", 0)),
                float(r.get("valorpixdevolvidosintegralmente", 0.0)), 
                int(r.get("quantidadedevolvidaparcialmentepormeiodomed", 0)),
                float(r.get("valorpixdevolvidosparcialmente", 0.0)), 
                float(r.get("valorpixresidualnaodevolvido", 0.0)),
                int(r.get("quantidadedenaodevolvidossaldoinsuficiente", 0)), 
                float(r.get("valorpixnaodevolvidossaldoinsuficiente", 0.0)),
                int(r.get("quantidadedenaodevolvidoscontaencerrada", 0)), 
                float(r.get("valornaodevolvidoscontaencerrada", 0.0)),
                int(r.get("quantidadedenaodevolvidosmotivosdiversos", 0)), 
                float(r.get("valorpixnaodevolvidosmotivosdiversos", 0.0)),
                float(r.get("percentualdedevolucao", 0.0)), 
                int(r.get("qtdepixbloqueadoscautelarmenteeliberados", 0)),
                float(r.get("valorpixbloqueadoscautelarmenteeliberados", 0.0)), 
                int(r.get("qtdepixbloqueadoscautelarmenteedevolvidos", 0)),
                float(r.get("valorpixbloqueadoscautelarmenteedevolvidos", 0.0))
            )
            for _, r in df_fraud.iterrows()
        ]
        
        cur.executemany("""
            INSERT INTO pix_fraudes_historica (
                anomes, qtdepixcontestados, qtdecontestacoesaceitas, qtdecontestacoesrejeitadas,
                qtdecontestacoesaceitasacada100mil, qtdeusuarioscommarcacoesdefraude, qtdechavespixcommarcacoesdefraude,
                valorpixcontestadosaceitos, quantidadedevolvidaintegralmentepormeiodomed, valorpixdevolvidosintegralmente,
                quantidadedevolvidaparcialmentepormeiodomed, valorpixdevolvidosparcialmente, valorpixresidualnaodevolvido,
                quantidadedenaodevolvidossaldoinsuficiente, valorpixnaodevolvidossaldoinsuficiente, quantidadedenaodevolvidoscontaencerrada,
                valornaodevolvidoscontaencerrada, quantidadedenaodevolvidosmotivosdiversos, valorpixnaodevolvidosmotivosdiversos,
                percentualdedevolucao, qtdepixbloqueadoscautelarmenteeliberados, valorpixbloqueadoscautelarmenteeliberados,
                qtdepixbloqueadoscautelarmenteedevolvidos, valorpixbloqueadoscautelarmenteedevolvidos
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, rec_fraud)
        print(f"✅ {len(rec_fraud)} registros de fraudes/MED Pix inseridos.")

    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    carregar_dados_pix()