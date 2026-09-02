import os
from datetime import datetime, timedelta
import pandas as pd
import requests
import psycopg2
from src.config import POSTGRES_URL

SERIES_BCB = {
    "selic": 432,
    "ipca_12m": 13522,
    "desocupacao": 24369,
    "carteira_total": 20539,          # Saldo da carteira de crédito - Total
    "inadimplencia_total": 21082,
    "juros_medios": 20716,
}

def carregar_macro_automatico():
    data_inicio = (datetime.now() - timedelta(days=400)).strftime('%d/%m/%Y')
    records = []
    
    for indicador, codigo in SERIES_BCB.items():
        url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial={data_inicio}"
        headers = {"User-Agent": "Mozilla/5.0"}
        
        # Tentativa com timeout estendido de 30 segundos
        sucesso = False
        for tentativa in range(3):
            try:
                resp = requests.get(url, headers=headers, timeout=30)
                if resp.status_code == 200:
                    for item in resp.json():
                        dt = pd.to_datetime(item['data'], format='%d/%m/%Y').date()
                        val = float(item['valor'])
                        records.append((dt, indicador, val))
                    sucesso = True
                    break
            except Exception as e:
                print(f"⚠️ Tentativa {tentativa+1} falhou para série {codigo} ({indicador}): {e}")
        
        if not sucesso:
            print(f"❌ Não foi possível carregar a série {codigo} ({indicador}) após 3 tentativas.")

    cutoff = datetime.now().date() - timedelta(days=367)
    records = [r for r in records if r[0] >= cutoff]

    if not records:
        print("❌ Nenhum dado foi obtido da API do BCB.")
        return

    conn = psycopg2.connect(POSTGRES_URL)
    cur = conn.cursor()
    
    cur.execute("TRUNCATE TABLE indicadores_macro_historica RESTART IDENTITY;")
    
    cur.executemany("""
        INSERT INTO indicadores_macro_historica (data_referencia, indicador, valor)
        VALUES (%s, %s, %s)
    """, records)
    
    conn.commit()
    cur.close()
    conn.close()
    print(f"✅ Sucesso! {len(records)} registros macroeconômicos atualizados automaticamente do BCB.")

if __name__ == "__main__":
    carregar_macro_automatico()