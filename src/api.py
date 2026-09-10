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
import mlflow
from mlflow.tracking import MlflowClient
import numpy as np

from src.config import POSTGRES_URL, MONGO_URI
from src.feature_engineering import feature_engineering_avancada
from src.decision_engine import avaliar_proposta_credito
from src.fraud_engine import evaluate_fraud_risk
from src.nba_engine import determine_next_best_action

import sys
from src.models import EnsembleClassifier
sys.modules['models'] = sys.modules['src.models']

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
        
        # Engenharia de features + interações extras do treino
        df_processed = feature_engineering_avancada(input_data)
        if 'monthlydebtpayments' in df_processed.columns and 'monthlyincome' in df_processed.columns:
            df_processed['comprometimento_renda'] = df_processed['monthlydebtpayments'] / (df_processed['monthlyincome'] + 1e-5)
        if 'totalassets' in df_processed.columns and 'totalliabilities' in df_processed.columns:
            df_processed['patrimonio_liquido_calc'] = df_processed['totalassets'] - df_processed.get('totalliabilities', 0)
        if 'loanamount' in df_processed.columns and 'annualincome' in df_processed.columns:
            df_processed['emprestimo_vs_renda_anual'] = df_processed['loanamount'] / (df_processed['annualincome'] + 1e-5)
        if 'savingsaccountbalance' in df_processed.columns and 'checkingaccountbalance' in df_processed.columns and 'monthlydebtpayments' in df_processed.columns:
            soma_saldos = df_processed['savingsaccountbalance'] + df_processed['checkingaccountbalance']
            df_processed['cobertura_liquidez'] = soma_saldos / (df_processed['monthlydebtpayments'] + 1e-5)

        if hasattr(pipeline, "feature_names_in_") and pipeline.feature_names_in_ is not None:
            for col in pipeline.feature_names_in_:
                if col not in df_processed.columns:
                    df_processed[col] = 0.0
            df_processed = df_processed[pipeline.feature_names_in_]

        # Predição do risco de crédito pelo modelo campeão
        pd_score = float(pipeline.predict_proba(df_processed)[:, 1][0])
        decisao = avaliar_proposta_credito(
            pd_score=pd_score,
            renda_mensal=proposta.monthlyincome,
            valor_solicitado=proposta.loanamount,
            threshold=0.3814  # Threshold seguro validado do campeão
        )

        # Avaliação de Risco de Fraude (Fraud Engine)
        analise_fraude = evaluate_fraud_risk(
            loan_amnt=proposta.loanamount,
            annual_inc=proposta.annualincome,
            monthly_debts=proposta.monthlydebtpayments
        )

        # Próxima Melhor Ação Comercial (NBA Engine)
        dti_calculado = (proposta.monthlydebtpayments / (proposta.monthlyincome + 1e-5)) * 100
        nba_recomendacao = determine_next_best_action(
            annual_inc=proposta.annualincome,
            pd_score=decisao["approval_probability"],
            status=decisao["status"],
            dti=dti_calculado
        )

        try:
            mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=1000)
            db = mongo_client["finsight_behavioral"]
            db["customer_events"].insert_one({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "customer_name": proposta.name,
                "pd_score": pd_score,
                "decision": decisao["status"],
                "fraud_suspicious": analise_fraude["is_suspicious"],
                "requested_amount": proposta.loanamount
            })
        except Exception:
            pass

        return {
            "customer_name": proposta.name,
            "estimated_annual_income": proposta.annualincome,
            "evaluation": decisao,
            "fraud_analysis": analise_fraude,
            "next_best_action": nba_recomendacao
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/dashboard-metrics')
def get_dashboard_metrics():
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor()
        
        # Totais do portfólio
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

        # Agrupamento por UF
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
            
        # Concentração por Porte
        cur.execute("""
            SELECT COALESCE(porte, 'Não Informado'), COALESCE(SUM(carteira_ativa), 0)
            FROM carteira_bcb_historica
            GROUP BY porte
            ORDER BY SUM(carteira_ativa) DESC;
        """)
        porte_rows = cur.fetchall()
        distribuicao_porte = [{"porte": r[0], "carteira": float(r[1])} for r in porte_rows]

        # Distribuição por Faixa de Risco
        distribuicao_risco = [
            {"faixa": "Baixo Risco (AA-B)", "valor": float(carteira_ativa_total * 0.55)},
            {"faixa": "Risco Médio (C-F)", "valor": float(carteira_ativa_total * 0.30)},
            {"faixa": "Alto Risco / Inadimplente (G-H)", "valor": float(carteira_ativa_total * 0.15)},
        ]
        
        # Ranking de Modalidades reais agrupadas da base do BCB
        cur.execute("""
            SELECT COALESCE(modalidade, 'Outros') as modalidade, COALESCE(SUM(carteira_ativa), 0)
            FROM carteira_bcb_historica
            GROUP BY modalidade
            ORDER BY SUM(carteira_ativa) DESC
            LIMIT 6;
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

@app.get('/api/pix-fraud-dashboard-metrics')
def get_pix_fraud_dashboard_metrics():
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor()
        
        # Função para converter '202512' em 'Dez/25'
        def formatar_anomes(anomes_str):
            if not anomes_str or len(str(anomes_str)) != 6:
                return str(anomes_str)
            meses = {'01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun', 
                     '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'}
            ano = str(anomes_str)[2:4]
            mes = str(anomes_str)[4:6]
            return f"{meses.get(mes, mes)}/{ano}"

        # Totais Gerais
        cur.execute("""
            SELECT 
                COALESCE(SUM(valorpixcontestadosaceitos), 0), 
                COALESCE(SUM(qtdepixcontestados), 0),
                COALESCE(AVG(percentualdedevolucao), 0),
                COALESCE(SUM(valorpixbloqueadoscautelarmenteedevolvidos), 0),
                COALESCE(SUM(valorpixresidualnaodevolvido), 0),
                COUNT(*) 
            FROM pix_fraudes_historica;
        """)
        valor_total, qtd_total, taxa_recuperacao_media, valor_bloqueado_dev, valor_residual_nao_dev, total_registros = cur.fetchone()

        cur.execute("""
            SELECT COALESCE(SUM(valor), 0), COALESCE(SUM(quantidade), 0)
            FROM pix_transacoes_historica;
        """)
        valor_transacoes_geral, qtd_transacoes_geral = cur.fetchone()

        # Evolução Temporal (Geral vs Fraudes)
        cur.execute("""
            SELECT f.anomes, 
                   COALESCE(SUM(f.valorpixcontestadosaceitos), 0), 
                   COALESCE(SUM(f.qtdepixcontestados), 0),
                   COALESCE(SUM(t.valor), 0),
                   COALESCE(SUM(t.quantidade), 0),
                   COALESCE(SUM(f.qtdecontestacoesrejeitadas), 0)
            FROM pix_fraudes_historica f
            LEFT JOIN pix_transacoes_historica t ON f.anomes = t.anomes
            GROUP BY f.anomes
            ORDER BY f.anomes ASC;
        """)
        rows_temporal = cur.fetchall()
        evolucao_temporal = []
        for r in rows_temporal:
            evolucao_temporal.append({
                "anomes_raw": str(r[0]),
                "data": formatar_anomes(r[0]),
                "valor_envolvido": float(r[1]),
                "quantidade_fraudes": int(r[2]),
                "valor_transacoes": float(r[3]),
                "quantidade_transacoes": int(r[4]),
                "fraudes_rejeitadas": int(r[5])
            })

        # Séries temporais completas para os Sparklines e Deltas dos KPIs
        serie_transacoes = [{"data": r["data"], "valor": r["valor_transacoes"]} for r in evolucao_temporal]
        serie_fraudes_valor = [{"data": r["data"], "valor": r["valor_envolvido"]} for r in evolucao_temporal]
        serie_fraudes_qtd = [{"data": r["data"], "valor": r["quantidade_fraudes"]} for r in evolucao_temporal]
        
        # Taxa de Devolução MED agrupada mês a mês para refletir a variação real
        cur.execute("""
            SELECT anomes, COALESCE(AVG(percentualdedevolucao), 0)
            FROM pix_fraudes_historica
            GROUP BY anomes
            ORDER BY anomes ASC;
        """)
        serie_taxa_rec = [{"data": formatar_anomes(r[0]), "valor": round(float(r[1]), 2)} for r in cur.fetchall()]

        serie_bloqueados = [{"data": r["data"], "valor": round(r["valor_envolvido"] * 0.4, 2)} for r in evolucao_temporal]
        serie_residual = [{"data": r["data"], "valor": round(r["valor_envolvido"] * 0.3, 2)} for r in evolucao_temporal]

        # Função para calcular o delta percentual (último mês vs penúltimo mês)
        def calcular_delta(serie):
            if len(serie) < 2:
                return 0.0
            penultimo = serie[-2]["valor"]
            ultimo = serie[-1]["valor"]
            if penultimo == 0:
                return 0.0
            return round(((ultimo - penultimo) / penultimo) * 100, 2)

        deltas = {
            "transacoes": calcular_delta(serie_transacoes),
            "fraudes_valor": calcular_delta(serie_fraudes_valor),
            "fraudes_qtd": calcular_delta(serie_fraudes_qtd),
            "taxa_rec": calcular_delta(serie_taxa_rec),
            "bloqueados": calcular_delta(serie_bloqueados),
            "residual": calcular_delta(serie_residual)
        }

        valores_atuais = {
            "transacoes": serie_transacoes[-1]["valor"] if serie_transacoes else valor_transacoes_geral,
            "fraudes_valor": serie_fraudes_valor[-1]["valor"] if serie_fraudes_valor else valor_total,
            "fraudes_qtd": serie_fraudes_qtd[-1]["valor"] if serie_fraudes_qtd else qtd_total,
            "taxa_rec": serie_taxa_rec[-1]["valor"] if serie_taxa_rec else taxa_recuperacao_media,
            "bloqueados": serie_bloqueados[-1]["valor"] if serie_bloqueados else valor_bloqueado_dev,
            "residual": serie_residual[-1]["valor"] if serie_residual else valor_residual_nao_dev,
        }

        # Distribuição por Faixa Etária
        cur.execute("""
            SELECT COALESCE(pag_idade, 'Não Informado'), COALESCE(SUM(valor), 0)
            FROM pix_transacoes_historica
            GROUP BY pag_idade
            ORDER BY SUM(valor) DESC
            LIMIT 5;
        """)
        por_faixa_etaria = [{"faixa": r[0], "valor": float(r[1])} for r in cur.fetchall()]

        # Top Regiões Pagadoras
        cur.execute("""
            SELECT COALESCE(pag_regiao, 'Não Informado'), COALESCE(SUM(valor), 0)
            FROM pix_transacoes_historica
            GROUP BY pag_regiao
            ORDER BY SUM(valor) DESC
            LIMIT 5;
        """)
        por_regiao = [{"regiao": r[0], "valor": float(r[1])} for r in cur.fetchall()]

        # Natureza da Transação Pix
        cur.execute("""
            SELECT COALESCE(natureza, 'Não Informado'), COALESCE(SUM(valor), 0)
            FROM pix_transacoes_historica
            GROUP BY natureza
            ORDER BY SUM(valor) DESC
            LIMIT 5;
        """)
        por_natureza = [{"natureza": r[0], "valor": float(r[1])} for r in cur.fetchall()]

        # Motivos de Não Devolução (MED)
        cur.execute("""
            SELECT 
                COALESCE(SUM(valorpixnaodevolvidossaldoinsuficiente), 0),
                COALESCE(SUM(valornaodevolvidoscontaencerrada), 0),
                COALESCE(SUM(valorpixnaodevolvidosmotivosdiversos), 0)
            FROM pix_fraudes_historica;
        """)
        res_saldo, res_conta, res_diversos = cur.fetchone()
        motivos_nao_devolucao = [
            {"motivo": "Saldo Insuficiente", "valor": float(res_saldo)},
            {"motivo": "Conta Encerrada", "valor": float(res_conta)},
            {"motivo": "Motivos Diversos", "valor": float(res_diversos)}
        ]

        cur.close()
        conn.close()
        
        return {
            "valores_atuais": valores_atuais,
            "deltas": deltas,
            "series_kpis": {
                "transacoes": serie_transacoes,
                "fraudes_valor": serie_fraudes_valor,
                "fraudes_qtd": serie_fraudes_qtd,
                "taxa_rec": serie_taxa_rec,
                "bloqueados": serie_bloqueados,
                "residual": serie_residual
            },
            "evolucao_temporal": evolucao_temporal,
            "por_faixa_etaria": por_faixa_etaria,
            "por_regiao": por_regiao,
            "por_natureza": por_natureza,
            "motivos_nao_devolucao": motivos_nao_devolucao
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
    # Define o período (últimos 367 dias)
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
            "selic": _delta(df_selic, meses=1, modo="pp", formato_data='%m/%Y'),
            "ipca_12m": _delta(_serie_indicador("ipca_12m"), meses=1, modo="pp"),
            "desocupacao": _delta(_serie_indicador("desocupacao"), meses=1, modo="pp"),
            "ativos_problematicos_segmentado": ativos_problematicos_segmentado,
        }
        
        cur.close()
        conn.close()
        return resultado
    except Exception as e:
        return {"error": str(e)}
    
@app.get('/api/mlflow-model-metrics')
def get_mlflow_model_metrics():
    try:
        client = MlflowClient()
        experiment_name = "FinSight_Loan_Approval_Risk"
        experiment = client.get_experiment_by_name(experiment_name)
        
        if not experiment:
            raise HTTPException(status_code=404, detail="Nenhum experimento do MLflow encontrado.")
            
        runs = client.search_runs(
            experiment_ids=[experiment.experiment_id],
            order_by=["attribute.start_time DESC"]
        )
        
        modelos_unicos = {}
        
        for run in runs:
            tags = run.data.tags
            run_name = tags.get("mlflow.runName", "")
            metrics = run.data.metrics
            params = run.data.params
            
            if "Champion_Production" in run_name or "Financial_Risk" in run_name:
                continue
                
            modelo_nome = params.get("model_name", "")
            if not modelo_nome:
                modelo_nome = run_name.replace("Run_", "").replace("_", " ")

            if "Ensemble" in modelo_nome:
                modelo_nome = "Ensemble (CatBoost + XGBoost)"
            elif "XGBoost" in modelo_nome:
                modelo_nome = "XGBoost"

            auc_val = float(metrics.get("auc", 0.0))
            if auc_val <= 0.1:
                continue
                
            if modelo_nome not in modelos_unicos:
                modelos_unicos[modelo_nome] = {
                    "modelo": str(modelo_nome),
                    "auc": auc_val,
                    "gini": float(metrics.get("gini", 0.0)),
                    "f1": float(metrics.get("f1", 0.0)),
                    "accuracy": float(metrics.get("accuracy", 0.0)),
                    "precision": float(metrics.get("precision", 0.0)),
                    "recall": float(metrics.get("recall", 0.0)),
                    "g_mean": float(metrics.get("g_mean", 0.0)),
                    "best_threshold": float(metrics.get("best_threshold", 0.5)),
                    "status": "Candidato",
                    "params": params
                }
                
        runs_data = list(modelos_unicos.values())
        
        if not runs_data:
            raise HTTPException(status_code=404, detail="Nenhum modelo válido encontrado.")
            
        runs_data = sorted(runs_data, key=lambda x: x["auc"], reverse=True)
        runs_data[0]["status"] = "Produção"
        campeao = runs_data[0]

        return {
            "campeao": campeao,
            "comparativo": runs_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))