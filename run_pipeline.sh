echo "=== FinSight Pipeline: Fase 1 ==="

# 1. Subir a infraestrutura de Bancos no Docker
echo "[1/3] Subindo contêineres PostgreSQL e MongoDB..."
docker-compose up -d

# 2. Executar Download e ETL automatizado
echo "[2/3] Executando pipeline Python (Kaggle API + Polars)..."
python src/data_prep.py

# 3. Carregar dados processados nas bases SQL e NoSQL
echo "[3/3] Populando banco PostgreSQL e MongoDB..."
python src/database_load.py

echo "Fase 1 concluída com sucesso sem intervenção manual!"