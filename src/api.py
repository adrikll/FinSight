import os
import glob
import psycopg2
from pymongo import MongoClient
from datetime import datetime
import mlflow.sklearn
import pandas as pd
import numpy as np
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from src.nba_engine import determine_next_best_action

from fastapi import FastAPI, HTTPException, BackgroundTasks
from src.webhook_engine import dispatch_webhook_event
from src.azure_storage import upload_file_to_azure

from src.fraud_engine import evaluate_fraud_risk

from src.decision_engine import evaluate_credit_decision

app = FastAPI(title="FinSight API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurações dos Bancos
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://finsight_user:finsight_password@postgres:5432/finsight_db")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongodb:27017")

# Schema de Validação
class CreditApplication(BaseModel):
    loan_amnt: float = Field(..., json_schema_extra={"example": 15000.0})
    term: str = Field(..., json_schema_extra={"example": "36 Meses"})
    emp_length: str = Field(..., json_schema_extra={"example": "10+ anos"})
    home_ownership: str = Field(..., json_schema_extra={"example": "RENT"})
    annual_inc: float = Field(..., json_schema_extra={"example": 75000.0})
    monthly_debts: float = Field(default=0.0, json_schema_extra={"example": 1150.0})
    dti: Optional[float] = Field(default=None)
    
    # Valores padrão para o schema do modelo
    int_rate: float = Field(default=12.0)
    installment: float = Field(default=0.0)
    grade: str = Field(default="B")
    sub_grade: str = Field(default="B3")
    verification_status: str = Field(default="Verified")
    purpose: str = Field(default="debt_consolidation")
    delinq_2yrs: float = Field(default=0.0)
    inq_last_6mths: float = Field(default=1.0)
    open_acc: float = Field(default=10.0)
    pub_rec: float = Field(default=0.0)
    revol_bal: float = Field(default=12000.0)
    revol_util: float = Field(default=45.2)
    total_acc: float = Field(default=22.0)
    issue_d: str = Field(default="2015-12-01")
    earliest_cr_line: str = Field(default="2001-08-01")

# Carregamento do Modelo MLflow
model = None
mlflow_model_path = "/app/mlruns/2/models/m-c2ec97af2639444bb1a5f5963ec9e84d/artifacts"

try:
    if os.path.exists(mlflow_model_path):
        model = mlflow.sklearn.load_model(mlflow_model_path)
        print("Modelo do MLflow carregado com sucesso!")
    else:
        print(f"Diretório {mlflow_model_path} não encontrado.")
except Exception as e:
    print(f"Erro ao carregar modelo do MLflow: {e}")

# Funções Auxiliares de Persistência

def get_postgres_connection():
    """Garante suporte a SSL automaticamente quando conectado ao Azure."""
    connection_args = {}
    if "postgres.database.azure.com" in POSTGRES_URL:
        connection_args["sslmode"] = "require"
    return psycopg2.connect(POSTGRES_URL, **connection_args)

def save_to_postgres(data: dict, decision: dict):
    """Salva dados da proposta no PostgreSQL (Local ou Azure)."""
    try:
        conn = get_postgres_connection()
        cur = conn.cursor()
        
        cur.execute(
            """
            INSERT INTO customers (name, annual_inc, home_ownership, emp_length)
            VALUES (%s, %s, %s, %s) RETURNING customer_id;
            """,
            ("Cliente Simulação", data["annual_inc"], data["home_ownership"], data["emp_length"])
        )
        customer_id = cur.fetchone()[0]

        cur.execute(
            """
            INSERT INTO credit_applications 
            (customer_id, requested_amount, term, monthly_debts, pd_score, risk_rating, status, approved_limit, suggested_rate, decision_reason)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """,
            (
                customer_id,
                data["loan_amnt"],
                data["term"],
                data["monthly_debts"],
                decision["pd_score"],
                decision["rating"],
                decision["status"],
                decision["approved_limit"],
                decision["suggested_rate"],
                decision["decision_reason"]
            )
        )
        conn.commit()
        cur.close()
        conn.close()
        print("Dados salvos no PostgreSQL com sucesso!")
    except Exception as e:
        print(f"Erro ao salvar no Postgres: {e}")

def save_to_mongodb(data: dict, decision: dict):
    """Salva logs de eventos de navegação/simulação no MongoDB."""
    try:
        client = MongoClient(MONGO_URI)
        db = client["finsight_behavioral"]
        event = {
            "event_type": "credit_simulation",
            "timestamp": datetime.utcnow(),
            "payload": data,
            "decision_result": decision
        }
        db.customer_events.insert_one(event)
        print("Evento salvo no MongoDB com sucesso!")
    except Exception as e:
        print(f"Erro ao salvar no MongoDB: {e}")

def prepare_features_for_inference(df: pd.DataFrame) -> np.ndarray:
    df = df.copy()

    home_map = {
        "RENT": 0, "MORTGAGE": 1, "OWN": 2, "OTHER": 3,
        "Própria (OWN)": 2, "Alugada (RENT)": 0, "Financiada (MORTGAGE)": 1
    }
    emp_map = {
        "< 1 year": 0, "1 year": 1, "2 years": 2, "3 years": 3,
        "4 years": 4, "5 years": 5, "6 years": 6, "7 years": 7,
        "8 years": 8, "9 years": 9, "10+ years": 10,
        "< 1 ano": 0, "1 ano": 1, "5 anos": 5, "10+ anos": 10
    }

    if "home_ownership" in df.columns:
        df["home_ownership"] = df["home_ownership"].map(home_map).fillna(0)
    if "emp_length" in df.columns:
        df["emp_length"] = df["emp_length"].map(emp_map).fillna(0)

    df['loan_to_income'] = df['loan_amnt'] / (df['annual_inc'] + 1)
    df['installment_to_monthly_inc'] = df['installment'] / ((df['annual_inc'] / 12) + 1)
    df['stress_index'] = (df['dti'] * df.get('revol_util', 0)) / 100
    df['estimated_total_credit'] = df['revol_bal'] / ((df['revol_util'] / 100) + 0.01)
    df['available_credit'] = df['estimated_total_credit'] - df['revol_bal']
    df['interest_burden'] = df['installment'] * (df['int_rate'] / 100)
    df['income_quantile'] = 5.0

    X_sample = df.drop(
        columns=['target_default', 'member_id', 'issue_d', 'earliest_cr_line', 'monthly_debts'], 
        errors='ignore'
    )

    cat_cols = X_sample.select_dtypes(include=['object', 'category']).columns.tolist()
    for col in cat_cols:
        X_sample[col] = X_sample[col].astype('category').cat.codes.astype(float)

    return X_sample.astype(float).values

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": model is not None}

@app.post("/predict")
def predict_credit(application: CreditApplication, background_tasks: BackgroundTasks):
    if model is None:
        raise HTTPException(status_code=500, detail="Modelo preditivo não carregado.")

    try:
        data = application.model_dump()

        # 1. Avaliação de Fraude e Anomalia
        fraud_analysis = evaluate_fraud_risk(
            loan_amnt=data["loan_amnt"],
            annual_inc=data["annual_inc"],
            monthly_debts=data["monthly_debts"]
        )

        # DTI Automático
        monthly_income = data["annual_inc"] / 12 if data["annual_inc"] > 0 else 1.0
        if data.get("dti") is None or data.get("dti") == 0:
            calculated_dti = (data["monthly_debts"] / monthly_income) * 100
            data["dti"] = round(calculated_dti, 2)

        if "36" in str(data["term"]):
            term_str = " 36 months"
            num_payments = 36
        else:
            term_str = " 60 months"
            num_payments = 60
        data["term"] = term_str

        estimated_int_rate = 12.0
        monthly_rate = (estimated_int_rate / 100) / 12
        data["int_rate"] = estimated_int_rate
        data["installment"] = round(
            (data["loan_amnt"] * monthly_rate) / (1 - (1 + monthly_rate) ** -num_payments), 2
        )

        raw_df = pd.DataFrame([data])
        X_prep = prepare_features_for_inference(raw_df)

        pd_proba = float(model.predict_proba(X_prep)[:, 1][0])

        decision = evaluate_credit_decision(
            pd_score=pd_proba,
            requested_amount=application.loan_amnt,
            annual_inc=application.annual_inc
        )

        # Anexa o resultado da análise de fraude na resposta
        decision["fraud_analysis"] = fraud_analysis

        # Bloqueia aprovação automática se for sinalizado como suspeita de fraude
        if fraud_analysis["is_suspicious"]:
            decision["status"] = "REVISÃO MANUAL"
            decision["decision_reason"] += f" | ALERTA DE FRAUDE: {', '.join(fraud_analysis['flags'])}"

        # Gravação nos bancos de dados (Postgres e Mongo)
        save_to_postgres(data, decision)
        save_to_mongodb(data, decision)

        # Disparo de Webhook (se houver alerta de fraude ou recusa)
        event_type = "risk.high_alert" if fraud_analysis["is_suspicious"] else ("credit.rejected" if decision["status"] == "RECUSADO" else "credit.approved")
        background_tasks.add_task(dispatch_webhook_event, event_type, data, decision)

        return decision

    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Erro na inferência: {str(err)}")
    
@app.get("/customer/{customer_id}/360")
def get_customer_360(customer_id: int):
    try:
        # 1. Busca dados cadastrais e histórico de solicitações no PostgreSQL
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor()
        
        cur.execute("SELECT customer_id, name, annual_inc, home_ownership, emp_length, created_at FROM customers WHERE customer_id = %s;", (customer_id,))
        cust = cur.fetchone()
        
        if not cust:
            raise HTTPException(status_code=404, detail="Cliente não encontrado no PostgreSQL.")

        customer_data = {
            "customer_id": cust[0],
            "name": cust[1],
            "annual_inc": float(cust[2]),
            "home_ownership": cust[3],
            "emp_length": cust[4],
            "created_at": str(cust[5])
        }

        cur.execute("""
            SELECT application_id, requested_amount, term, monthly_debts, pd_score, risk_rating, status, approved_limit, suggested_rate, decision_reason, created_at 
            FROM credit_applications 
            WHERE customer_id = %s 
            ORDER BY created_at DESC;
        """, (customer_id,))
        apps = cur.fetchall()
        cur.close()
        conn.close()

        applications_history = []
        for app_row in apps:
            applications_history.append({
                "application_id": app_row[0],
                "requested_amount": float(app_row[1]),
                "term": app_row[2],
                "monthly_debts": float(app_row[3]),
                "pd_score": float(app_row[4]),
                "risk_rating": app_row[5],
                "status": app_row[6],
                "approved_limit": float(app_row[7]),
                "suggested_rate": float(app_row[8]),
                "decision_reason": app_row[9],
                "created_at": str(app_row[10])
            })

        # 2. Busca eventos comportamentais no MongoDB
        client = MongoClient(MONGO_URI)
        db = client["finsight_behavioral"]
        mongo_events = list(db.customer_events.find({}, {"_id": 0}).sort("timestamp", -1).limit(10))

        # 3. Processa a Next Best Action baseada na última simulação
        last_app = applications_history[0] if applications_history else {}
        last_pd = last_app.get("pd_score", 0.0)
        last_status = last_app.get("status", "N/A")
        
        monthly_inc = customer_data["annual_inc"] / 12 if customer_data["annual_inc"] > 0 else 1.0
        monthly_debts = last_app.get("monthly_debts", 0.0)
        dti = (monthly_debts / monthly_inc) * 100

        nba = determine_next_best_action(
            annual_inc=customer_data["annual_inc"],
            pd_score=last_pd,
            status=last_status,
            dti=dti
        )

        return {
            "customer_profile": customer_data,
            "credit_history": applications_history,
            "behavioral_events_log": mongo_events,
            "next_best_action": nba
        }

    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Erro ao compilar visão Customer 360: {str(err)}")
    
@app.post("/webhooks/receiver-mock")
def mock_webhook_receiver(event: dict):
    """
    Simula o receptor de automação (ex: Power Automate / CRM / Bot RPA).
    Exibe o evento recebido e aciona as réguas operacionais.
    """
    event_type = event.get("event_type")
    data = event.get("data", {})
    decision = data.get("decision", {})

    print("\n" + "="*50)
    print(f" WEBHOOK RECEBIDO: [{event_type}]")
    print(f" ID do Evento: {event.get('event_id')}")
    print(f" Status da Decisão: {decision.get('status')} (PD: {decision.get('pd_score')}%)")
    
    if event_type == "credit.rejected":
        print(" [RPA ACTION]: Cadastrando proposta em régua de acompanhamento de 90 dias.")
        print(" [RPA ACTION]: Enviando e-mail automático com justificativa e opções de renegociação.")
    elif event_type == "credit.approved":
        print(" [RPA ACTION]: Gerando minuta contratual e disponibilizando limite no App.")
        print(" [RPA ACTION]: Enviando WhatsApp com link de assinatura digital.")
    print("="*50 + "\n")

    return {"status": "event_received_and_processed"}