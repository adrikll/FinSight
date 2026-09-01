import json
import os
import joblib
import pandas as pd
import numpy as np
import mlflow
import mlflow.sklearn
from mlflow.models.signature import infer_signature

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    roc_auc_score, f1_score, precision_score,
    recall_score, brier_score_loss, precision_recall_curve,
    average_precision_score
)
from category_encoders import TargetEncoder
from catboost import CatBoostClassifier

from feature_engineering import feature_engineering_avancada, save_income_bins

mlflow.set_experiment("FinSight_BCB_Credit_Risk")

INCOME_BINS_PATH = "artifacts/income_bins.json"
MODEL_PKL_PATH = "artifacts/champion_model.pkl"


def calcular_ks(y_true, y_pred_proba):
  df = pd.DataFrame({'target': y_true, 'proba': y_pred_proba}).sort_values(
      by='proba', ascending=False
  )
  df['bads'] = df['target']
  df['goods'] = 1 - df['target']
  df['cum_bads'] = df['bads'].cumsum() / (df['bads'].sum() + 1e-8)
  df['cum_goods'] = df['goods'].cumsum() / (df['goods'].sum() + 1e-8)
  return np.max(np.abs(df['cum_bads'] - df['cum_goods']))


def encontrar_melhor_threshold(y_true, y_pred_proba):
  precisions, recalls, thresholds = precision_recall_curve(y_true, y_pred_proba)
  f1_scores = 2 * (precisions * recalls) / (precisions + recalls + 1e-8)
  best_idx = np.argmax(f1_scores)
  best_thresh = thresholds[best_idx] if best_idx < len(thresholds) else 0.5
  return best_thresh, f1_scores[best_idx]


def train_ensemble_model():
  print(
      "Carregando dataset oficial do BCB (SCR.data) e gerando Features"
      " Avançadas..."
  )
  raw_df = pd.read_parquet("data/processed/bcb_credit_sample.parquet")

  os.makedirs(os.path.dirname(INCOME_BINS_PATH), exist_ok=True)

  # Estimativa de bins de renda baseados nos dados do BCB
  income_col = (
      "annual_inc"
      if "annual_inc" in raw_df.columns
      else "carteira_a_vencer"
  )
  income_filled = raw_df[income_col].fillna(raw_df[income_col].median())
  _, income_bins = pd.qcut(
      income_filled, q=10, retbins=True, duplicates="drop"
  )
  save_income_bins(income_bins, INCOME_BINS_PATH)
  print(f"Bins de volume/renda salvos em {INCOME_BINS_PATH}")

  df = feature_engineering_avancada(raw_df, income_bins=income_bins)

  # Remove colunas target e identificadores
  ignore_cols = ["target_default", "ï»¿data_base", "data_base", "member_id"]
  X = df.drop(columns=[c for c in ignore_cols if c in df.columns], errors="ignore")
  y = df["target_default"]

  cat_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()
  num_cols = X.select_dtypes(include=["int64", "float64"]).columns.tolist()

  print("\n" + "=" * 50)
  print("SCHEMA ESPERADO PELO MODELO DO BCB (SEM LEAKAGE):")
  print(f"NUM_COLS ({len(num_cols)}): {num_cols}")
  print(f"CAT_COLS ({len(cat_cols)}): {cat_cols}")
  print("=" * 50 + "\n")

  X[num_cols] = X[num_cols].astype(float)

  X_train_val, X_test, y_train_val, y_test = train_test_split(
      X, y, test_size=0.2, random_state=42, stratify=y
  )
  X_train, X_validation, y_train, y_validation = train_test_split(
      X_train_val,
      y_train_val,
      test_size=0.25,
      random_state=43,
      stratify=y_train_val,
  )

  ratio = (len(y_train) - sum(y_train)) / (sum(y_train) + 1e-8)

  numeric_transformer = Pipeline(steps=[
      ("imputer", SimpleImputer(strategy="median")),
      ("scaler", StandardScaler()),
  ])

  categorical_transformer = Pipeline(
      steps=[("target_enc", TargetEncoder(cols=cat_cols, smoothing=15))]
  )

  preprocessor = ColumnTransformer(
      transformers=[
          ("num", numeric_transformer, num_cols),
          ("cat", categorical_transformer, cat_cols),
      ]
  )

  print("Treinando modelo campeão CatBoost sobre microdados do BCB...")
  model_cat = CatBoostClassifier(
      iterations=500,
      depth=6,
      learning_rate=0.03,
      scale_pos_weight=ratio,
      random_seed=42,
      verbose=0,
  )

  pipeline = Pipeline(
      steps=[("preprocessor", preprocessor), ("model", model_cat)]
  )
  pipeline.fit(X_train, y_train)

  val_proba = pipeline.predict_proba(X_validation)[:, 1]
  val_auc = roc_auc_score(y_validation, val_proba)
  best_threshold, _ = encontrar_melhor_threshold(y_validation, val_proba)

  # Ajusta o modelo final com dados de treino + validação
  pipeline.fit(X_train_val, y_train_val)
  test_proba = pipeline.predict_proba(X_test)[:, 1]
  test_binary = (test_proba >= best_threshold).astype(int)

  final_auc = roc_auc_score(y_test, test_proba)
  final_ks = calcular_ks(y_test, test_proba)
  final_f1 = f1_score(y_test, test_binary)
  final_prec = precision_score(y_test, test_binary)
  final_rec = recall_score(y_test, test_binary)
  final_brier = brier_score_loss(y_test, test_proba)

  print(f"\n--- MÉTRICAS FINAIS DO MODELO CAMPEÃO BCB (CatBoost Calibrado) ---")
  print(f"Threshold Otimizado : {best_threshold:.4f}")
  print(f"ROC-AUC            : {final_auc:.4f}")
  print(f"Gini Index         : {(2 * final_auc - 1):.4f}")
  print(f"KS Statistic       : {final_ks:.4f}")
  print(f"F1-Score           : {final_f1:.4f}")
  print(f"Precision          : {final_prec:.4f}")
  print(f"Recall             : {final_rec:.4f}")
  print(f"Brier Score        : {final_brier:.4f}\n")

  # SALVA UMA CÓPIA DIRETA VIA JOBLIB NA PASTA ARTIFACTS
  os.makedirs("artifacts", exist_ok=True)
  joblib.dump(pipeline, MODEL_PKL_PATH)
  print(f"💾 Cópia direta do modelo salva em: {MODEL_PKL_PATH}")

  with mlflow.start_run(run_name="BCB_CatBoost_Champion_Calibrated") as run:
    mlflow.log_param("champion_type", "CatBoost_BCB_Calibrated")
    mlflow.log_param("best_threshold", best_threshold)
    mlflow.log_metric("roc_auc", final_auc)
    mlflow.log_metric("pr_auc", average_precision_score(y_test, test_proba))
    mlflow.log_metric("ks_statistic", final_ks)
    mlflow.log_metric("f1_score", final_f1)

    signature = infer_signature(
        X_train, pipeline.predict_proba(X_train.head(5))
    )
    mlflow.sklearn.log_model(
        pipeline,
        name="model",
        serialization_format="cloudpickle",
        signature=signature,
        input_example=X_train.head(5),
    )
    mlflow.log_artifact(INCOME_BINS_PATH, artifact_path="model")
    mlflow.log_artifact(MODEL_PKL_PATH, artifact_path="model")

    with open("artifacts/latest_model_path.txt", "w") as f:
      f.write(MODEL_PKL_PATH)

    print(
        f"✅ Modelo campeão registrado com sucesso no MLflow e apontado em:"
        f" {MODEL_PKL_PATH}"
    )


if __name__ == "__main__":
  train_ensemble_model()