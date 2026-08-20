import os
import pandas as pd
import numpy as np
import mlflow
import mlflow.sklearn
import matplotlib.pyplot as plt

from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    roc_auc_score, f1_score, precision_score, 
    recall_score, brier_score_loss
)
from category_encoders import TargetEncoder
from lightgbm import LGBMClassifier
from xgboost import XGBClassifier
from catboost import CatBoostClassifier

mlflow.set_experiment("FinSight_Credit_Risk_HighPerf")

def calcular_ks(y_true, y_pred_proba):
    df = pd.DataFrame({'target': y_true, 'proba': y_pred_proba}).sort_values(by='proba', ascending=False)
    df['bads'] = df['target']
    df['goods'] = 1 - df['target']
    df['cum_bads'] = df['bads'].cumsum() / df['bads'].sum()
    df['cum_goods'] = df['goods'].cumsum() / df['goods'].sum()
    return np.max(np.abs(df['cum_bads'] - df['cum_goods']))

def feature_engineering_avancada(df):
    df = df.copy()

    df['loan_to_income'] = df['loan_amnt'] / (df['annual_inc'] + 1)
    df['installment_to_monthly_inc'] = df['installment'] / ((df['annual_inc'] / 12) + 1)
    
    if 'dti' in df.columns and 'revol_util' in df.columns:
        df['stress_index'] = (df['dti'] * df['revol_util']) / 100

    if 'revol_bal' in df.columns and 'revol_util' in df.columns:
        df['estimated_total_credit'] = df['revol_bal'] / ((df['revol_util'] / 100) + 0.01)
        df['available_credit'] = df['estimated_total_credit'] - df['revol_bal']

    if 'int_rate' in df.columns and 'installment' in df.columns:
        df['interest_burden'] = df['installment'] * (df['int_rate'] / 100)

    if 'annual_inc' in df.columns:
        df['income_quantile'] = pd.qcut(df['annual_inc'].fillna(df['annual_inc'].median()), q=10, labels=False, duplicates='drop')

    return df

def train_ensemble_model():
    print("Carregando dataset e gerando Features Avançadas...")
    raw_df = pd.read_parquet("data/processed/lending_club_sample.parquet")
    df = feature_engineering_avancada(raw_df)

    X = df.drop(columns=['target_default', 'member_id', 'issue_d', 'earliest_cr_line'], errors='ignore')
    y = df['target_default']

    cat_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
    num_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("Aplicando Pré-processamento e Target Encoding OOF...")
    imputer = SimpleImputer(strategy='median')
    scaler = StandardScaler()

    X_train_num = scaler.fit_transform(imputer.fit_transform(X_train[num_cols]))
    X_test_num = scaler.transform(imputer.transform(X_test[num_cols]))

    target_enc = TargetEncoder(cols=cat_cols, smoothing=15)
    X_train_cat = target_enc.fit_transform(X_train[cat_cols], y_train)
    X_test_cat = target_enc.transform(X_test[cat_cols])

    X_train_prep = np.hstack([X_train_num, X_train_cat.values])
    X_test_prep = np.hstack([X_test_num, X_test_cat.values])

    print("Inicializando Stacking Ensemble (LightGBM + XGBoost + CatBoost)...")
    
    lgb = LGBMClassifier(
        n_estimators=500, max_depth=6, learning_rate=0.03,
        num_leaves=63, scale_pos_weight=2.5, random_state=42, verbose=-1
    )
    
    xgb = XGBClassifier(
        n_estimators=400, max_depth=5, learning_rate=0.03,
        scale_pos_weight=2.5, random_state=42, eval_metric='logloss'
    )
    
    cat = CatBoostClassifier(
        iterations=400, depth=6, learning_rate=0.04,
        scale_pos_weight=2.5, random_seed=42, verbose=0
    )

    ensemble = StackingClassifier(
        estimators=[('lgb', lgb), ('xgb', xgb), ('cat', cat)],
        final_estimator=LogisticRegression(),
        cv=5,
        n_jobs=-1
    )

    with mlflow.start_run(run_name="Stacking_Ensemble_HighPerf"):
        print("Treinando Ensemble de Alta Performance...")
        ensemble.fit(X_train_prep, y_train)

        y_pred_proba = ensemble.predict_proba(X_test_prep)[:, 1]

        best_threshold = 0.21
        y_pred_binary = (y_pred_proba >= best_threshold).astype(int)

        auc = roc_auc_score(y_test, y_pred_proba)
        ks = calcular_ks(y_test, y_pred_proba)
        f1 = f1_score(y_test, y_pred_binary)
        prec = precision_score(y_test, y_pred_binary)
        rec = recall_score(y_test, y_pred_binary)
        brier = brier_score_loss(y_test, y_pred_proba)

        print(f"\n--- RESULTADOS FINAIS DO STACKING ENSEMBLE ---")
        print(f"Threshold Otimizado: {best_threshold:.2f}")
        print(f"ROC-AUC    : {auc:.4f}")
        print(f"KS         : {ks:.4f}")
        print(f"F1-Score   : {f1:.4f}")
        print(f"Precision  : {prec:.4f}")
        print(f"Recall     : {rec:.4f}")
        print(f"Brier Score: {brier:.4f}\n")

        mlflow.log_param("best_threshold", best_threshold)
        mlflow.log_metric("roc_auc", auc)
        mlflow.log_metric("ks_statistic", ks)
        mlflow.log_metric("f1_score", f1)
        mlflow.log_metric("precision", prec)
        mlflow.log_metric("recall", rec)
        mlflow.log_metric("brier_score", brier)

        # Salva usando o formato cloudpickle para evitar bloqueios do skops
        mlflow.sklearn.log_model(
            ensemble, 
            name="model", 
            serialization_format="cloudpickle"
        )
        print("Ensemble treinado e registrado no MLflow com sucesso!")

if __name__ == "__main__":
    train_ensemble_model()