import json
import numpy as np
import pandas as pd


def feature_engineering_avancada(
    df: pd.DataFrame, income_bins: np.ndarray = None
) -> pd.DataFrame:
  df = df.copy()

  # 1. Correção do BOM (ï»¿) e Normalização das Colunas
  df.columns = (
      df.columns.str.replace("ï»¿", "", regex=False)
      .str.strip()
      .str.lower()
  )

  # 2. Correção de Encoding (Caracteres Especiais)
  char_map = {
      "Ãº": "u",
      "Ã­": "i",
      "Ã£": "a",
      "Ã©": "e",
      "Ã´": "o",
      "Ã¡": "a",
      "Ã§": "c",
      "Â": "",
  }
  str_cols = df.select_dtypes(include=["object", "category"]).columns
  for col in str_cols:
    for bad, good in char_map.items():
      df[col] = df[col].astype(str).str.replace(bad, good, regex=False)

  # 3. Filtragem de Escopo (Foco em Pessoa Física para a Plataforma FinSight)
  if "cliente" in df.columns:
    df = df[df["cliente"].str.upper() == "PF"].copy()

  # 4. Tratamento Numérico
  num_cols_scr = [
      "carteira_a_vencer",
      "a_vencer_ate_90_dias",
      "a_vencer_de_91_ate_360_dias",
      "a_vencer_de_361_ate_1080_dias",
      "a_vencer_de_1081_ate_1800_dias",
      "a_vencer_de_1801_ate_5400_dias",
      "a_vencer_acima_de_5400_dias",
      "numero_de_operacoes",
  ]
  for col in num_cols_scr:
    if col in df.columns:
      df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

  # 5. Features Preditivas (Sem vazamento de carteira_ativa)
  if "a_vencer_ate_90_dias" in df.columns and "carteira_a_vencer" in df.columns:
    df["ratio_curto_prazo"] = df["a_vencer_ate_90_dias"] / (
        df["carteira_a_vencer"] + 1.0
    )

  if (
      "a_vencer_acima_de_5400_dias" in df.columns
      and "carteira_a_vencer" in df.columns
  ):
    df["ratio_longissimo_prazo"] = df["a_vencer_acima_de_5400_dias"] / (
        df["carteira_a_vencer"] + 1.0
    )

  if "carteira_a_vencer" in df.columns and "numero_de_operacoes" in df.columns:
    df["ticket_medio_a_vencer"] = df["carteira_a_vencer"] / (
        df["numero_de_operacoes"] + 0.01
    )

  # Estimativa de Renda baseada no saldo a vencer
  if "carteira_a_vencer" in df.columns:
    df["annual_inc"] = np.maximum(24000.0, df["carteira_a_vencer"] * 1.5)

  # Discretização em Decis de Renda
  if "annual_inc" in df.columns:
    income_filled = df["annual_inc"]
    if income_bins is not None:
      df["income_quantile"] = pd.cut(
          income_filled,
          bins=income_bins,
          labels=False,
          include_lowest=True,
      )
      df["income_quantile"] = (
          df["income_quantile"].fillna(len(income_bins) - 2).astype(float)
      )
    else:
      df["income_quantile"] = pd.qcut(
          income_filled, q=10, labels=False, duplicates="drop"
      ).astype(float)

  # 6. EXCLUSÃO RÍGIDA DE VARIÁVEIS DE VAZAMENTO E ATALHOS CATEGÓRICOS (submodalidade)
  leakage_cols = [
      "submodalidade",  # Causa o vazamento de atalho categórico identificado na AED
      "carteira_ativa",  # Totalizador implícito (carteira_a_vencer + vencida)
      "carteira_inadimplencia",
      "vencido_acima_de_90_dias",
      "vencido_de_15_ate_90_dias",
      "carteira_vencida",
      "ativo_problematico",
  ]
  df.drop(
      columns=[c for c in leakage_cols if c in df.columns],
      inplace=True,
      errors="ignore",
  )

  return df


def save_income_bins(bins: np.ndarray, path: str) -> None:
  with open(path, "w") as f:
    json.dump(bins.tolist(), f)


def load_income_bins(path: str) -> np.ndarray:
  with open(path, "r") as f:
    return np.array(json.load(f))