<div align="center">

<img src="imgs/logo.svg" alt="FinSight Logo" width="80" style="border-radius: 16px;" />

# *FinSight — Plataforma de Inteligência Financeira & Governança de IA*

<p align="center">
  <a href="https://finsight-analysis.vercel.app" target="_blank"><img src="https://img.shields.io/badge/_Acessar-FinSight-7c3aed?style=for-the-badge" alt="FinSight" /></a>
</p>

<p align="center">
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel" alt="Vercel" /></a>
  <a href="https://render.com"><img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render&logoColor=black" alt="Render" /></a>
  <a href="https://azure.microsoft.com"><img src="https://img.shields.io/badge/Database-Azure%20PostgreSQL-0078D4?style=flat&logo=postgresql&logoColor=white" alt="Azure PostgreSQL" /></a>
  <a href="https://mlflow.org"><img src="https://img.shields.io/badge/ML-MLflow-0194E2?style=flat&logo=mlflow&logoColor=white" alt="MLflow" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat&logo=react&logoColor=black" alt="React + Vite" /></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://github.com/features/actions"><img src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat&logo=github-actions&logoColor=white" alt="GitHub Actions" /></a>
  <a href="https://www.docker.com"><img src="https://img.shields.io/badge/Container-Docker-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="https://scikit-learn.org"><img src="https://img.shields.io/badge/ML-Scikit--learn-F7931E?style=flat&logo=scikit-learn&logoColor=white" alt="Scikit-learn" /></a>
  <a href="https://www.mongodb.com"><img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=flat&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
</p>

</div>

---

## Aplicação

<p align="center">
  <a href="https://finsight-analysis.vercel.app" target="_blank">
    <img src="imgs/gif_finsight.gif" alt="FinSight em Ação" width="100%" />
  </a>
</p>

---

## Sobre

O FinSight é uma aplicação web full-stack de alta performance desenvolvida para o setor financeiro e de crédito. O ecossistema unifica:
- Análises macroeconômicas oficiais sobre o mercado de crédito brasileiro;
- Monitoramento de transações instantâneas contra fraudes no ecossistema Pix;
- Simulação preditiva de concessão de crédito baseada em Machine Learning;
- Governança algorítmica ponta a ponta, com rastreabilidade completa dos modelos em nuvem (MLflow + Azure).

---

## Fontes de Dados e Módulos da Aplicação

O ecossistema do FinSight é dividido em quatro módulos principais, alimentados por dados oficiais e modelos preditivos:

 **Panorama Nacional de Crédito:**
   - **Fonte:** Amostra representativa de ~30k registros do **SCR.data**, complementada por séries temporais do **SGS** e **IFData** (Banco Central do Brasil), consumidas via API.
   - **Indicadores:** Carteira de crédito total, inadimplência, Selic, IPCA, juros médios e desocupação.

 **Monitor Pix, Fraudes e Estatísticas:**
   - **Fonte:** Dados abertos oficiais do Banco Central do Brasil focados no ecossistema de pagamentos instantâneos.
   - **Indicadores:** Estatísticas transacionais do Pix, montantes contestados e taxas/motivos de devolução via Mecanismo Especial de Devolução (MED).

 **Simulador Inteligente de Crédito:**
   - **Fonte:** Baseado no dataset *Financial Risk for Loan Approval* (Kaggle).
   - **Abordagem:** Utiliza variáveis socioeconômicas e financeiras acessíveis, permitindo que o usuário responda de forma simples e rápida para obter uma análise de risco preditiva.

 **Governança, Explicabilidade e IA:**
   - **Fonte/Processamento:** Métricas de desempenho rastreadas via **MLflow** a partir do treinamento de modelos de Ensemble (CatBoost, XGBoost, LightGBM).
   - **Objetivo:** Explicar detalhadamente o funcionamento da simulação de crédito, exibindo scores de probabilidade, limiares ótimos de corte (G-Mean) e explicabilidade algorítmica.
---

## Arquitetura de Dados e Nuvem

O projeto adota uma arquitetura em nuvem desacoplada e escalável:

<p align="center">
  <img src="imgs/arquitetura_dados.png" alt="FinSight em Ação" width="100%" />
</p>

| Camada | Componentes | Responsabilidade |
|---|---|---|
| **Fontes** | SCR.data, SGS/IFData (BCB), Kaggle | Ingestão primária de dados brutos (*read-only*) |
| **ETL e Prep** | `data_prep.py`, `database_load.py`, `azure_storage.py` | Limpeza (encoding UTF-8-SIG), parsing de zips, tratamento de outliers e carga |
| **Armazenamento** | Azure PostgreSQL, MongoDB, Azure Blob Storage | Persistência transacional (propostas, séries), logs/telemetria e artefatos de IA |
| **Camada de ML** | `train.py`, MLflow, `artifacts/champion_model.pkl` | Treinamento, versionamento de experimentos e serialização do modelo campeão |
| **Backend / API** | FastAPI (`src/api.py`), Engines de Decisão, Fraude e NBA | Orquestração de regras de negócio e inferência REST |
| **Frontend** | React (Vite) | Interface visual, simuladores interativos e storytelling de dados |

---

## Fluxo de Dados (End-to-End)

1. **Extração:** Leitura automatizada de arquivos oficiais do SCR.data (pacotes zip mensais do BCB) e dados do Kaggle via `kagglehub`.
2. **Tratamento (`data_prep.py`):** Correção de encoding, unificação de múltiplos arquivos dos zips, engenharia de *features* e expurgo de variáveis com vazamento (*data leakage*).
3. **Persistência (`database_load.py`):** Dados estruturados salvos no **PostgreSQL** (`propostas_credito`, `credit_applications`) e dados flexíveis/telemetria no **MongoDB**.
4. **Treinamento e MLOps (`train.py`):** Stack de Ensemble (RandomForest, LightGBM, XGBoost, CatBoost) rastreado via **MLflow**. O **CatBoost calibrado** atua como campeão em produção.
5. **Inferência em Tempo Real:** O endpoint `/predict` recebe o intake, executa as regras do motor de crédito (`decision_engine.py`), pontuação de anomalias (`fraud_engine.py`) e recomendação comercial (`nba_engine.py`), salvando a proposta auditada no banco.

---

## Machine Learning e Governança

- **Prevenção de Vazamento (*Data Leakage*):** Variáveis pós-decisão (`installment`, `int_rate`, `grade`) foram removidas do treino. O modelo utiliza apenas variáveis disponíveis no momento da subscrição (*intake*).
- **Tratamento de Desbalanceamento:** Utilização da biblioteca `imbalanced-learn` devido à proporção de ~80% adimplentes vs ~20% inadimplentes.
- **Otimização:** Busca de hiperparâmetros automatizada via **Optuna** e explicabilidade gerada por **SHAP**.
- **Rastreabilidade:** Todos os parâmetros, métricas e artefatos binários são versionados no repositório de metadados do MLflow e Azure Blob Storage.

---

## Infraestrutura, DevOps e Deploy

- **Containerização:** Docker (`python:3.11-slim`) com dependências compiladas (`libgomp1` para modelos de árvore de decisão).
- **Orquestração Local:** Docker Compose gerencia 3 serviços (`finsight-api`, `postgres`, `mongodb`), injetando segredos do Azure Key Vault e volumes persistentes para logs e artefatos do MLflow.
- **Ambientes de Deploy:**
  - **Frontend:** Vercel.
  - **Backend / API:** Render.
  - **Banco de Dados (Produção):** Azure Database for PostgreSQL + Azure Blob Storage + Azure Key Vault.
- **CI/CD:** Pipelines automatizadas com **GitHub Actions** e suíte de testes de integração com **Pytest**.

---

## Stack Tecnológica

| Categoria | Ferramentas |
|---|---|
| **Linguagem e API** | Python 3.11, FastAPI, Pydantic, Uvicorn |
| **Frontend** | React, Vite, Tailwind CSS, Recharts |
| **Machine Learning** | Scikit-learn, CatBoost, XGBoost, LightGBM, SHAP, Optuna, imbalanced-learn |
| **MLOps** | MLflow (Tracking e Artifact Store) |
| **Dados e Bancos** | Pandas, SQLAlchemy, PostgreSQL (Azure / Local), MongoDB |
| **Cloud e DevOps** | Microsoft Azure (Blob Storage, Key Vault, PostgreSQL), Docker, Docker Compose, GitHub Actions |
| **Deploy** | Vercel (Frontend), Render (Backend) |