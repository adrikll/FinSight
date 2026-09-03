import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta
import json
import requests

from src.config import POSTGRES_URL, MONGO_URI
from src.feature_engineering import feature_engineering_avancada
from src.decision_engine import avaliar_proposta_credito

app = FastAPI(title="FinSight Credit & Pix Engine API", version="3.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "artifacts/champion_model.pkl"
pipeline = joblib.load(MODEL_PATH)

class PropostaCadastralRequest(BaseModel):
    name: str
    age: int
    annualincome: float
    monthlyincome: float
    employmentstatus: str
    educationlevel: str
    experience: float
    loanamount: float
    loanduration: int
    maritalstatus: str
    numberofdependents: int
    homeownershipstatus: str
    monthlydebtpayments: float
    creditcardutilizationrate: float
    savingsaccountbalance: float
    checkingaccountbalance: float
    totalassets: float
    totalliabilities: float
    jobtenure: float
    networth: float
    loanpurpose: str
    uf: str

class CenarioCrescimentoRequest(BaseModel):
    percentual_crescimento: float

@app.get("/health")
def health_check():
    return {"status": "online", "credit_model_loaded": pipeline is not None}

@app.post("/predict")
def predict_credit(proposta: PropostaCadastralRequest):
    try:
        input_data = pd.DataFrame([proposta.dict()])
        input_data.columns = input_data.columns.str.strip().str.lower()
        df_processed = feature_engineering_avancada(input_data)

        if hasattr(pipeline, "feature_names_in_"):
            for col in pipeline.feature_names_in_:
                if col not in df_processed.columns:
                    df_processed[col] = 0.0
            df_processed = df_processed[pipeline.feature_names_in_]

        pd_score = float(pipeline.predict_proba(df_processed)[:, 1][0])
        decisao = avaliar_proposta_credito(
            pd_score=pd_score,
            renda_mensal=proposta.monthlyincome,
            valor_solicitado=proposta.loanamount,
            threshold=0.5329
        )

        try:
            mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=1000)
            db = mongo_client["finsight_behavioral"]
            db["customer_events"].insert_one({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "customer_name": proposta.name,
                "pd_score": pd_score,
                "decision": decisao["status"],
                "requested_amount": proposta.loanamount
            })
        except Exception:
            pass

        return {"customer_name": proposta.name, "estimated_annual_income": proposta.annualincome, "evaluation": decisao}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/dashboard-metrics')
def get_dashboard_metrics():
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor()
        
        # Totais consolidados do portfólio
        cur.execute("""
            SELECT 
                COALESCE(SUM(carteira_ativa), 0), 
                COALESCE(SUM(carteira_inadimplencia), 0), 
                COUNT(*) 
            FROM carteira_bcb_historica;
        """)
        carteira_ativa_total, inadimplida_total, total_registros = cur.fetchone()
        carteira_ativa_total, inadimplida_total = float(carteira_ativa_total), float(inadimplida_total)
        taxa_inadimplencia = (inadimplida_total / carteira_ativa_total * 100) if carteira_ativa_total > 0 else 0.0

        # Risco por tipo de cliente (PF vs PJ)
        cur.execute("""
            SELECT cliente, COALESCE(SUM(carteira_ativa),0), COALESCE(SUM(carteira_inadimplencia),0), COALESCE(SUM(ativo_problematico),0) 
            FROM carteira_bcb_historica 
            GROUP BY cliente;
        """)
        risco_pf_pj = {}
        for cliente, carteira, inad, prob in cur.fetchall():
            risco_pf_pj[cliente] = {
                "carteira": float(carteira),
                "taxa_inadimplencia": round((inad/carteira*100) if carteira > 0 else 0, 2),
                "taxa_ativo_problematico": round((prob/carteira*100) if carteira > 0 else 0, 2),
            }

        # Agrupamento por UF para alimentar o mapa
        cur.execute("""
            SELECT TRIM(UPPER(uf)), COALESCE(SUM(carteira_ativa),0), COALESCE(SUM(carteira_inadimplencia),0), COALESCE(SUM(ativo_problematico),0) 
            FROM carteira_bcb_historica 
            WHERE uf IS NOT NULL AND TRIM(uf) != ''
            GROUP BY TRIM(UPPER(uf)) 
            ORDER BY TRIM(UPPER(uf)) ASC;
        """)
        mapa_uf = []
        for uf_val, carteira, inad, prob in cur.fetchall():
            sigla = str(uf_val).strip()
            c_val = float(carteira) if carteira else 0.0
            mapa_uf.append({
                "uf": sigla, 
                "carteira": c_val,
                "taxa_inadimplencia": round((float(inad) / c_val * 100) if c_val > 0 else 0, 2),
                "taxa_ativo_problematico": round((float(prob) / c_val * 100) if c_val > 0 else 0, 2),
            })
            
        #Concentração por Porte para o novo gráfico
        cur.execute("""
            SELECT COALESCE(porte, 'Não Informado'), COALESCE(SUM(carteira_ativa), 0)
            FROM carteira_bcb_historica
            GROUP BY porte
            ORDER BY SUM(carteira_ativa) DESC;
        """)
        porte_rows = cur.fetchall()
        distribuicao_porte = [{"porte": r[0], "carteira": float(r[1])} for r in porte_rows]

        #Distribuição por Faixa de Risco (se aplicável ou simulada por faixas de inadimplência/atraso)
        # Caso sua tabela possua classificações de risco, adapte o campo. Exemplo genérico:
        distribuicao_risco = [
            {"faixa": "Baixo Risco (AA-B)", "valor": float(carteira_ativa_total * 0.55)},
            {"faixa": "Risco Médio (C-F)", "valor": float(carteira_ativa_total * 0.30)},
            {"faixa": "Alto Risco / Inadimplente (G-H)", "valor": float(carteira_ativa_total * 0.15)},
        ]
        
        cur.execute("""
            SELECT COALESCE(modalidade, 'Outros') as modalidade, COALESCE(SUM(carteira_ativa), 0)
            FROM carteira_bcb_historica
            GROUP BY modalidade
            ORDER BY SUM(carteira_ativa) DESC
            LIMIT 5;
        """)
        modalidade_rows = cur.fetchall()
        distribuicao_modalidade = [{"modalidade": r[0], "valor": float(r[1])} for r in modalidade_rows]
            
        # Evolução de ativos problemáticos
        cur.execute("""
            SELECT data_base, COALESCE(SUM(ativo_problematico),0), COALESCE(SUM(carteira_ativa),0)
            FROM carteira_bcb_historica
            GROUP BY data_base ORDER BY data_base ASC;
        """)
        evolucao_ativo_problematico = []
        for data_base, problematico, ativa in cur.fetchall():
            taxa = (float(problematico) / float(ativa) * 100) if ativa > 0 else 0
            evolucao_ativo_problematico.append({"data": data_base.strftime('%m/%y'), "valor": round(taxa, 2)})

        ativo_problematico_taxa = evolucao_ativo_problematico[-1]['valor'] if evolucao_ativo_problematico else 0
        ativo_problematico_delta = (
            round(evolucao_ativo_problematico[-1]['valor'] - evolucao_ativo_problematico[-2]['valor'], 2)
            if len(evolucao_ativo_problematico) >= 2 else None
        )

        cur.execute("SELECT MAX(data_base), MAX(created_at) FROM carteira_bcb_historica;")
        ultima_data_base, carregado_em = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return {
            "carteira_ativa_total": carteira_ativa_total,
            "carteira_inadimplida_total": inadimplida_total,
            "taxa_inadimplencia": round(taxa_inadimplencia, 2),
            "total_registros_agregados": int(total_registros),
            "risco_pf_pj": risco_pf_pj,
            "mapa_uf": mapa_uf,
            "ultima_atualizacao": ultima_data_base.strftime('%m/%Y') if ultima_data_base else None,
            "carregado_em": carregado_em.strftime('%d/%m/%Y %H:%M') if carregado_em else None,
            "ativo_problematico_taxa": ativo_problematico_taxa,
            "ativo_problematico_delta": ativo_problematico_delta,
            "ativo_problematico_serie": evolucao_ativo_problematico[-6:],
            "distribuicao_porte": distribuicao_porte,
            "distribuicao_risco": distribuicao_risco,
            "distribuicao_modalidade": distribuicao_modalidade
        }
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/api/customer-360/{customer_name}")
def get_customer_360(customer_name: str):
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor()
        cur.execute("""
            SELECT requested_amount, approved_limit, pd_score, risk_rating, status, decision_reason, suggested_rate_annual
            FROM propostas_credito WHERE LOWER(customer_name) LIKE LOWER(%s);
        """, (f"%{customer_name}%",))
        rows = cur.fetchall()
        propostas = [{
            "requested_amount": float(r[0]), "approved_limit": float(r[1]), "pd_score": float(r[2]),
            "risk_rating": r[3], "status": r[4], "decision_reason": r[5], "suggested_rate_annual": float(r[6])
        } for r in rows]
        cur.close()
        conn.close()

        mongo_client = MongoClient(MONGO_URI)
        db = mongo_client["finsight_behavioral"]
        eventos = list(db["customer_events"].find({"customer_name": {"$regex": customer_name, "$options": "i"}}, {"_id": 0}))
        mongo_client.close()

        return {"customer_name": customer_name, "total_propostas": len(propostas), "propostas": propostas, "eventos_comportamentais": eventos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/pix-fraud-dashboard-metrics')
def get_pix_fraud_dashboard_metrics():
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                COALESCE(SUM(valorpixcontestadosaceitos), 0), 
                COALESCE(SUM(qtdepixcontestados), 0),
                COALESCE(AVG(percentualdedevolucao), 0),
                COUNT(*) 
            FROM pix_fraudes_historica;
        """)
        valor_total, qtd_total, taxa_recuperacao_media, total_registros = cur.fetchone()

        cur.execute("""
            SELECT COALESCE(SUM(valor), 0), COALESCE(SUM(quantidade), 0)
            FROM pix_transacoes_historica;
        """)
        valor_transacoes_geral, qtd_transacoes_geral = cur.fetchone()
        
        cur.execute("""
            SELECT f.anomes, 
                   COALESCE(SUM(f.valorpixcontestadosaceitos), 0), 
                   COALESCE(SUM(f.qtdepixcontestados), 0),
                   COALESCE(SUM(t.valor), 0),
                   COALESCE(SUM(t.quantidade), 0)
            FROM pix_fraudes_historica f
            LEFT JOIN pix_transacoes_historica t ON f.anomes = t.anomes
            GROUP BY f.anomes
            ORDER BY f.anomes ASC;
        """)
        evolucao_temporal = [
            {
                "data": str(r[0]), 
                "valor_envolvido": float(r[1]), 
                "quantidade_fraudes": int(r[2]),
                "valor_transacoes": float(r[3]),
                "quantidade_transacoes": int(r[4])
            } 
            for r in cur.fetchall()
        ]

        cur.close()
        conn.close()
        
        return {
            "valor_total_envolvido": float(valor_total),
            "quantidade_fraudes_total": int(qtd_total),
            "taxa_recuperacao_media": round(float(taxa_recuperacao_media), 2),
            "valor_transacoes_geral": float(valor_transacoes_geral),
            "quantidade_transacoes_geral": int(qtd_transacoes_geral),
            "total_registros_amostra": int(total_registros),
            "evolucao_temporal": evolucao_temporal
        }
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/api/macro/evolucao")
def get_evolucao_macro(data_inicio: str = "01/01/2020"):
    try:
        df_inad_pf = _consultar_sgs(21112, data_inicio).rename(columns={'valor': 'inadimplencia_pf'})
        df_inad_total = _consultar_sgs(21082, data_inicio).rename(columns={'valor': 'inadimplencia_total'})
        df_selic = _consultar_sgs(432, data_inicio).rename(columns={'valor': 'selic'})
        df_carteira = _consultar_sgs(20539, data_inicio).rename(columns={'valor': 'carteira_total'})

        df = pd.merge_asof(df_inad_pf.sort_values('data'), df_selic.sort_values('data'), on='data')
        df = pd.merge_asof(df.sort_values('data'), df_inad_total.sort_values('data'), on='data')
        df = pd.merge_asof(df.sort_values('data'), df_carteira.sort_values('data'), on='data')

        serie = [
            {
                "data": row['data'].strftime('%m/%Y'),
                "inadimplencia_pf": round(row['inadimplencia_pf'], 2),
                "selic": round(row['selic'], 2),
                "inadimplencia_total": round(row['inadimplencia_total'], 2) if pd.notna(row['inadimplencia_total']) else None,
                "carteira_total": round(row['carteira_total'], 2) if pd.notna(row['carteira_total']) else None,
            }
            for _, row in df.iterrows()
        ]
        return {"serie": serie}
    except Exception as e:
        return {"error": str(e)}
    
def _consultar_sgs(codigo, data_inicio="01/01/2020"):
    url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial={data_inicio}"
    headers = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    df = pd.DataFrame(resp.json())
    df['data'] = pd.to_datetime(df['data'], format='%d/%m/%Y')
    df['valor'] = df['valor'].astype(float)
    return df.sort_values('data').reset_index(drop=True)

def _consultar_sgs_recente(codigo):
    # Define o período dinamicamente para pegar os últimos 367 dias
    data_inicio = (datetime.now() - timedelta(days=367)).strftime('%d/%m/%Y')
    url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial={data_inicio}"
    headers = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    df = pd.DataFrame(resp.json())
    df['data'] = pd.to_datetime(df['data'], format='%d/%m/%Y')
    df['valor'] = df['valor'].astype(float)
    return df.sort_values('data').reset_index(drop=True)
    

def _delta_periodo(df, meses=1, modo="pp"):
    atual = df.iloc[-1]
    alvo = atual['data'] - pd.DateOffset(months=meses)
    anteriores = df[df['data'] <= alvo]
    delta, valor_ant = None, None
    if not anteriores.empty:
        anterior = anteriores.iloc[-1]
        valor_ant = round(anterior['valor'], 2)
        delta = round(((atual['valor'] / anterior['valor']) - 1) * 100, 2) if modo == "pct" else round(atual['valor'] - anterior['valor'], 2)
    return {
        "valor_atual": round(atual['valor'], 2),
        "valor_periodo_anterior": valor_ant,
        "delta": delta,
        "data_atual": atual['data'].strftime('%d/%m/%Y'),
        # Alterado de tail(6) para tail(20) para pegar os últimos registros diários e deixar o gráfico fluido
        "serie_recente": [{"data": r['data'].strftime('%d/%m'), "valor": round(r['valor'], 2)} for _, r in df.tail(20).iterrows()],
    }

@app.get("/api/macro/indicadores")
def get_indicadores_macro():
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor()

        def _serie_indicador(indicador):
            cur.execute("""
                SELECT data_referencia, valor FROM indicadores_macro_historica
                WHERE indicador = %s AND data_referencia <= CURRENT_DATE 
                ORDER BY data_referencia ASC
            """, (indicador,))
            rows = cur.fetchall()
            df = pd.DataFrame(rows, columns=["data", "valor"])
            if not df.empty:
                df["data"] = pd.to_datetime(df["data"])
                df["valor"] = df["valor"].astype(float)
            return df

        def _delta(df, meses=1, modo="pp", formato_data='%m/%Y'):
            if df.empty:
                return {"valor_atual": None, "delta": None, "data_atual": None, "serie_recente": []}
            
            # Garante agrupamento mensal para evitar excesso de pontos diários idênticos no minigráfico
            if 'data' in df.columns:
                df['mes_ano'] = df['data'].dt.to_period('M')
                df_grouped = df.groupby('mes_ano', as_index=False).agg({'valor': 'last', 'data': 'last'})
            else:
                df_grouped = df

            atual = df_grouped.iloc[-1]
            alvo = atual["data"] - pd.DateOffset(months=meses)
            anteriores = df_grouped[df_grouped["data"] <= alvo]
            delta = None
            if not anteriores.empty:
                anterior = anteriores.iloc[-1]
                delta = round(((atual["valor"] / anterior["valor"]) - 1) * 100, 2) if modo == "pct" else round(atual["valor"] - anterior["valor"], 2)
            
            return {
                "valor_atual": round(atual["valor"], 2),
                "delta": delta,
                "data_atual": atual["data"].strftime('%m/%Y'),
                # Agora pega os últimos meses consolidados em vez de dias corridos
                "serie_recente": [{"data": r["data"].strftime(formato_data), "valor": round(r["valor"], 2)} for _, r in df_grouped.tail(12).iterrows()],
            }

        # Série histórica geral de crédito
        cur.execute("""
            SELECT data_base, COALESCE(SUM(carteira_ativa),0), COALESCE(SUM(carteira_inadimplencia),0) 
            FROM carteira_bcb_historica 
            GROUP BY data_base 
            ORDER BY data_base ASC;
        """)
        credito_rows = cur.fetchall()
        serie_credito = []
        for dt, ativa, inad in credito_rows:
            taxa_inad = (inad / ativa * 100) if ativa > 0 else 0
            serie_credito.append({
                "data": dt.strftime('%m/%Y'),
                "carteira_total": float(ativa),
                "inadimplencia_total": round(taxa_inad, 2),
                "inadimplencia_pf": round(taxa_inad, 2)
            })

        # Ativos problemáticos segmentados por tipo de cliente (PF vs PJ) e histórico
        cur.execute("""
            SELECT data_base, cliente, COALESCE(SUM(ativo_problematico),0), COALESCE(SUM(carteira_ativa),0)
            FROM carteira_bcb_historica
            GROUP BY data_base, cliente
            ORDER BY data_base ASC;
        """)
        raw_ativos = cur.fetchall()
        
        # Estrutura para gráfico segmentado PF vs PJ de ativos problemáticos
        dict_ativos_seg = {}
        for dt, cli, prob, ativa in raw_ativos:
            mes_ano = dt.strftime('%m/%y')
            if mes_ano not in dict_ativos_seg:
                dict_ativos_seg[mes_ano] = {"data": mes_ano, "PF": 0.0, "PJ": 0.0}
            taxa_cli = (float(prob) / float(ativa) * 100) if ativa > 0 else 0.0
            dict_ativos_seg[mes_ano][cli] = round(taxa_cli, 2)
        
        ativos_problematicos_segmentado = list(dict_ativos_seg.values())

        df_selic = _serie_indicador("selic")
        if not df_selic.empty:
            df_selic['mes_ano'] = df_selic['data'].dt.to_period('M')
            df_selic = df_selic.groupby('mes_ano', as_index=False).agg({'valor': 'last', 'data': 'last'})

        resultado = {
            "serie": serie_credito,
            "carteira_total": _delta(_serie_indicador("carteira_total"), meses=1, modo="pct"),
            "inadimplencia_total": _delta(_serie_indicador("inadimplencia_total"), meses=1, modo="pp"),
            "juros_medios": _delta(_serie_indicador("juros_medios"), meses=1, modo="pp", formato_data='%m/%Y'), 
            "selic": _delta(df_selic, meses=1, modo="pp", formato_data='%m/%Y'), # <--- Usando o DataFrame agrupado por mês
            "ipca_12m": _delta(_serie_indicador("ipca_12m"), meses=1, modo="pp"),
            "desocupacao": _delta(_serie_indicador("desocupacao"), meses=1, modo="pp"),
            "ativos_problematicos_segmentado": ativos_problematicos_segmentado,
        }
        
        cur.close()
        conn.close()
        return resultado
    except Exception as e:
        return {"error": str(e)}