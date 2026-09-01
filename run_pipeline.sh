#!/bin/bash
set -e

echo "=================================================="
echo "INICIANDO EXECUTOR DO PIPELINE FINSIGHT (BACEN)"
echo "=================================================="

echo "Etapa 1: Ingestão e Amostragem Estratificada do BACEN..."
python data_prep.py

echo "Etapa 2: Carga de Amostra Inicial no PostgreSQL Azure..."
python database_load.py

echo "Etapa 3: Treinando Stacking Ensemble e Registrando no MLflow..."
python src/train.py

echo "Etapa 4: Executando Suíte de Testes Automatizados (Pytest)..."
pytest tests/test_api.py -v

echo "=================================================="
echo "PIPELINE FINSIGHT CONCLUÍDO COM SUCESSO!"
echo "=================================================="