import os
import joblib
import pandas as pd
import numpy as np
import mlflow
import mlflow.sklearn
from mlflow.models.signature import infer_signature

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_auc_score, classification_report, confusion_matrix
from category_encoders import TargetEncoder

from xgboost import XGBClassifier
from sklearn.ensemble import GradientBoostingClassifier

from feature_engineering import feature_engineering_avancada
from prepare_loan_dataset import carregar_dataset_loan

mlflow.set_experiment("FinSight_Loan_Approval_Risk")
MODEL_PKL_PATH = "artifacts/champion_model.pkl"

def train_loan_model():
    raw_df = carregar_dataset_loan()
    df = feature_engineering_avancada(raw_df)

    # Varredura inteligente e flexível para encontrar a coluna alvo
    target_candidates = ["loanapproved", "loan_approved", "loan_status"]
    target_col = None
    for col in target_candidates:
        if col in raw_df.columns:
            target_col = col
            break
            
    if target_col is None:
        raise KeyError(f"A coluna alvo não foi encontrada nas colunas disponíveis: {list(raw_df.columns)}")

    y = pd.to_numeric(raw_df[target_col], errors="coerce").fillna(0).astype(int)
    
    X = df.drop(columns=[target_col, "loanapproved", "loan_approved", "loan_status"], errors="ignore")

    cat_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()
    num_cols = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
    X[num_cols] = X[num_cols].astype(float)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    neg_count = sum(y_train == 0)
    pos_count = sum(y_train == 1)
    scale_weight = neg_count / (pos_count + 1e-8)

    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", RobustScaler()),
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

    # XGBoost hiper-otimizado com regularização forte para evitar falsos positivos
    model = XGBClassifier(
        n_estimators=800, 
        learning_rate=0.01, 
        max_depth=4,  # Menor profundidade reduz overfitting em casos limítrofes
        scale_pos_weight=scale_weight * 1.1,
        subsample=0.85, 
        colsample_bytree=0.85,
        gamma=0.2,
        random_state=42, 
        eval_metric="logloss", 
        n_jobs=-1
    )

    pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("model", model)])
    pipeline.fit(X_train, y_train)
    
    test_proba = pipeline.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, test_proba)
    print(f"🏆 XGBoost Refinado | ROC-AUC: {auc:.4f}")

    # Otimização refinada de Threshold com penalidade balanceada
    best_threshold = 0.5
    min_cost = float('inf')
    
    cost_fn = 4.5  # Ajustado para tolerar uma margem menor de falsos positivos
    cost_fp = 1.2  
    
    thresholds_to_test = np.linspace(0.1, 0.9, 500)
    for th in thresholds_to_test:
        preds = (test_proba >= th).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_test, preds).ravel()
        
        total_cost = (fn * cost_fn) + (fp * cost_fp)
        
        if total_cost < min_cost:
            min_cost = total_cost
            best_threshold = th

    y_pred = (test_proba >= best_threshold).astype(int)

    print(f"\n--- MÉTRICAS COM THRESHOLD CALIBRADO (Threshold: {best_threshold:.4f}) ---")
    print(classification_report(y_test, y_pred, target_names=["Denied (0)", "Approved (1)"]))
    
    cm = confusion_matrix(y_test, y_pred)
    print("Matriz de Confusão:")
    print(cm)

    os.makedirs("artifacts", exist_ok=True)
    joblib.dump(pipeline, MODEL_PKL_PATH)

    with mlflow.start_run(run_name="Financial_Risk_XGBoost_Production"):
        mlflow.log_param("best_model", "XGBoost")
        mlflow.log_metric("roc_auc", auc)
        mlflow.log_metric("best_threshold", best_threshold)
        
        # Força o cloudpickle para evitar falhas de serialização do skops
        mlflow.sklearn.log_model(
            pipeline, 
            artifact_path="model", 
            serialization_format="cloudpickle"
        )
        
        mlflow.log_artifact(MODEL_PKL_PATH)
        print(f"✅ Modelo salvo em: {MODEL_PKL_PATH}")

if __name__ == "__main__":
    train_loan_model()