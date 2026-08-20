import psycopg2
from pymongo import MongoClient
from config import POSTGRES_URL, MONGO_URI

def init_postgres():
    commands = [
        """
        CREATE TABLE IF NOT EXISTS customers (
            customer_id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            annual_inc NUMERIC(12, 2) NOT NULL,
            home_ownership VARCHAR(50),
            emp_length VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS credit_applications (
            application_id SERIAL PRIMARY KEY,
            customer_id INT REFERENCES customers(customer_id),
            requested_amount NUMERIC(12, 2) NOT NULL,
            term VARCHAR(20) NOT NULL,
            monthly_debts NUMERIC(12, 2) NOT NULL,
            pd_score NUMERIC(5, 2) NOT NULL,
            risk_rating VARCHAR(5) NOT NULL,
            status VARCHAR(20) NOT NULL,
            approved_limit NUMERIC(12, 2),
            suggested_rate NUMERIC(5, 2),
            decision_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE OR REPLACE VIEW vw_control_tower_kpis AS
        SELECT 
            COUNT(a.application_id) AS total_applications,
            SUM(a.requested_amount) AS total_requested_volume,
            SUM(a.approved_limit) AS total_approved_volume,
            ROUND(AVG(a.pd_score), 2) AS avg_portfolio_pd,
            COUNT(CASE WHEN a.status = 'APROVADO' THEN 1 END) AS approved_count,
            COUNT(CASE WHEN a.status = 'RECUSADO' THEN 1 END) AS rejected_count,
            ROUND((COUNT(CASE WHEN a.status = 'APROVADO' THEN 1 END)::numeric / COUNT(a.application_id)::numeric) * 100, 2) AS approval_rate
        FROM credit_applications a;
        """
    ]
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        cur = conn.cursor()
        for command in commands:
            cur.execute(command)
        conn.commit()
        cur.close()
        conn.close()
        print("Tabelas PostgreSQL inicializadas com sucesso!")
    except Exception as e:
        print(f"Erro ao inicializar PostgreSQL: {e}")

def init_mongo():
    try:
        client = MongoClient(MONGO_URI)
        db = client["finsight_behavioral"]
        if "customer_events" not in db.list_collection_names():
            db.create_collection("customer_events")
        print("Coleção 'customer_events' do MongoDB inicializada!")
    except Exception as e:
        print(f"Erro ao inicializar MongoDB: {e}")

if __name__ == "__main__":
    init_postgres()
    init_mongo()