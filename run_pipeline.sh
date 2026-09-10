#!/bin/bash
set -e

echo "Etapa 1: Preparação de Dados..."
python src/bcb_data_prep.py
python src/fraud_data_prep.py

echo "Etapa 2: Carga de Dados no PostgreSQL Azure..."
python src/macro_loader.py
python src/bcb_data_load.py
python src/fraud_data_load.py

echo "Etapa 3: Executando Suíte de Testes Automatizados (Pytest)..."
pytest tests/ -v

echo "Pipeline Finsight concluído com sucesso!"