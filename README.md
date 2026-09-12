<div align="center">

<img src="imgs/logo.svg" alt="FinSight Logo" width="80" style="border-radius: 16px;" />

# *FinSight — Plataforma de Inteligência Financeira & Governança de IA*

<p align="center">
  <a href="https://finsight-analysis.vercel.app" target="_blank"><img src="https://img.shields.io/badge/_Acessar-FinSight-7c3aed?style=for-the-badge" alt="FinSght" /></a>
</p>

<p align="center">
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel" alt="Vercel" /></a>
  <a href="https://render.com"><img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render&logoColor=black" alt="Render" /></a>
  <a href="https://azure.microsoft.com"><img src="https://img.shields.io/badge/Database-Azure%20PostgreSQL-0078D4?style=flat&logo=postgresql&logoColor=white" alt="Azure PostgreSQL" /></a>
  <a href="https://mlflow.org"><img src="https://img.shields.io/badge/ML-MLflow%203.15.1-0194E2?style=flat&logo=mlflow&logoColor=white" alt="MLflow" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat&logo=react&logoColor=black" alt="React + Vite" /></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://github.com/features/actions"><img src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?style=flat&logo=github-actions&logoColor=white" alt="GitHub Actions" /></a>
  <a href="https://www.docker.com"><img src="https://img.shields.io/badge/Container-Docker-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="https://scikit-learn.org"><img src="https://img.shields.io/badge/ML-Scikit--learn-F7931E?style=flat&logo=scikit-learn&logoColor=white" alt="Scikit-learn" /></a>
  <a href="https://www.sqlite.org"><img src="https://img.shields.io/badge/Database-SQLite-003B57?style=flat&logo=sqlite&logoColor=white" alt="SQLite" /></a>
  <a href="https://www.mongodb.com"><img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=flat&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
</p>

</div>

---

## Aplicação

<p align="center">
  <a href="https://finsight-analysis.vercel.app" target="_blank">
    <img src="imgs/navegacao_finsight.gif" alt="FinSight em Ação" width="100%" />
  </a>
</p>


---

## Sobre

O **FinSight** é uma aplicação web full-stack de alta performance desenvolvida para o setor financeiro e de crédito. O objetivo principal da plataforma é unificar em um único ecossistema análises macroeconômicas oficiais, monitoramento de transações instantâneas contra fraudes no ecossistema Pix, simulação preditiva de concessão de crédito baseada em Machine Learning e governança algorítmica ponta a ponta com rastreabilidade em nuvem.

---

## Fontes de Dados Utilizadas

O FinSight baseia-se em conjuntos de dados reais e representativos do mercado financeiro brasileiro e internacional:

1. **Panorama Nacional de Crédito:**
   * **Fonte:** Amostra representativa de **29.924 registros** extraídos do **SCR.data (Sistema de Informações de Crédito do Banco Central do Brasil - BCB)**.
   * **Indicadores:** Evolução da Carteira de Crédito Total, Taxa de Inadimplência, Meta Selic, IPCA (Inflação 12m), Taxa Média de Juros e Taxa de Desocupação.

2. **Simulador de Risco de Crédito:**
   * **Fonte:** Dataset ***Financial Risk for Loan Approval*** (proveniente do Kaggle).
   * **Variáveis:** Histórico de renda, montante do empréstimo, pontuação de crédito, histórico de inadimplência prévia e variáveis demográficas para predição de risco de default.
   * *Nota de escolha:* O dataset foi selecionado por permitir simulações baseadas em variáveis acessíveis ao cliente final, mantendo a simplicidade da experiência de uso sem a necessidade de dados confidenciais ou de difícil obtenção.

---

## Arquitetura de Dados & Nuvem

O projeto adota uma arquitetura em nuvem moderna, desacoplada e altamente escalável:

<p align="center">
  <img src="imgs/arquitetura_dados.png" alt="Arquitetura dos Dados" width="450"/>
</p>