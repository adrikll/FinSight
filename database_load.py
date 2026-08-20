import pandas as pd
from sqlalchemy import create_engine
from pymongo import MongoClient
import json
from datetime import datetime

#Carregar dados limpos do Parquet
df = pd.read_parquet("data/processed/lending_club_sample.parquet")

#Conexão com PostgreSQL (porta 5433)
pg_engine = create_engine('postgresql://finsight_user:finsight_password@localhost:5433/finsight_db')

# Tratar dados do Cliente
df_customers = df[['annual_inc', 'emp_length', 'home_ownership', 'dti']].drop_duplicates().reset_index(drop=True)

#Inserir clientes na tabela tb_customers
df_customers.to_sql('tb_customers', pg_engine, if_exists='append', index=False)
print("Tabela tb_customers populada no PostgreSQL!")

#Conexão MongoDB (Logs/Eventos)
mongo_client = MongoClient('mongodb://localhost:27017/')
db = mongo_client['finsight_events']
collection = db['customer_journey']

sample_events = [
    {
        "customer_id": 101,
        "event_type": "loan_application_started",
        "timestamp": datetime.now().isoformat(),
        "channel": "mobile_app",
        "metadata": {"requested_amount": 15000, "device": "iOS"}
    }
]

collection.insert_many(sample_events)
print("Logs de eventos criados no MongoDB!")