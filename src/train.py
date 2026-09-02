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
    print("--- INICIANDO TREINAMENTO CADASTRAL PURO (NOVO DATASET FINANCEIRO) ---")
    
    raw_df = carregar_dataset_loan()
    
    # Tratamento do target original antes da feature engineering
    raw_df.columns = raw_df.columns.str.strip().str.lower()
    target_col = "loanapproved" if "loanapproved" in raw_df.columns else "loan_status"
    
    if target_col not in raw_df.columns:
        raise KeyError(f"A coluna alvo não foi encontrada no dataset bruto.")

    y = pd.to_numeric(raw_df[target_col], errors="coerce").fillna(0).astype(int)
    
    # Aplica a engenharia limpando as colunas que o usuário não preenche
    df_features = feature_engineering_avancada(raw_df)
    
    X = df_features.drop(columns=[target_col], errors="ignore")

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

    models = {
        "XGBoost": XGBClassifier(
            n_estimators=700, learning_rate=0.015, max_depth=5,
            scale_pos_weight=scale_weight * 1.2,
            subsample=0.8, colsample_bytree=0.8,
            random_state=42, eval_metric="logloss", n_jobs=-1
        ),
        "GradientBoosting": GradientBoostingClassifier(
            n_estimators=500, learning_rate=0.02, max_depth=5,
            subsample=0.8,
            random_state=42
        )
    }

    best_auc = -1
    best_model_name = None
    best_pipeline = None

    print("\nAvaliando modelos com o novo dataset...")
    for name, clf in models.items():
        pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("model", clf)])
        pipeline.fit(X_train, y_train)
        
        proba = pipeline.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, proba)
        print(f"-> {name} | ROC-AUC: {auc:.4f}")
        
        if auc > best_auc:
            best_auc = auc
            best_model_name = name
            best_pipeline = pipeline

    print(f"\n🏆 Modelo Campeão: {best_model_name} (ROC-AUC: {best_auc:.4f})")

    # Otimização por Função de Custo Financeiro Real
    test_proba = best_pipeline.predict_proba(X_test)[:, 1]
    
    best_threshold = 0.5
    min_cost = float('inf')
    
    cost_fn = 5.0  # Custo severo de inadimplência (aprovar quem não deveria)
    cost_fp = 1.0  # Custo de oportunidade (recusar bom cliente)
    
    thresholds_to_test = np.linspace(0.05, 0.95, 300)
    for th in thresholds_to_test:
        preds = (test_proba >= th).astype(int)
        cm_temp = confusion_matrix(y_test, preds)
        tn, fp, fn, tp = cm_temp.ravel()
        
        total_cost = (fn * cost_fn) + (fp * cost_fp)
        
        if total_cost < min_cost:
            min_cost = total_cost
            best_threshold = th

    y_pred = (test_proba >= best_threshold).astype(int)

    print(f"\n--- MÉTRICAS DO MODELO COM THRESHOLD DE CUSTO (Threshold: {best_threshold:.4f}) ---")
    print(classification_report(y_test, y_pred, target_names=["Denied (0)", "Approved (1)"]))
    
    cm = confusion_matrix(y_test, y_pred)
    print("Matriz de Confusão:")
    print(cm)

    os.makedirs("artifacts", exist_ok=True)
    joblib.dump(best_pipeline, MODEL_PKL_PATH)

    with mlflow.start_run(run_name=f"Financial_Risk_{best_model_name}_CostOptimized"):
        mlflow.log_param("best_model", best_model_name)
        mlflow.log_metric("roc_auc", best_auc)
        mlflow.log_metric("best_threshold", best_threshold)
        signature = infer_signature(X_train, best_pipeline.predict_proba(X_train.head(5)))
        mlflow.sklearn.log_model(
            best_pipeline, 
            artifact_path="model", 
            serialization_format="cloudpickle",
            signature=signature
        )
        mlflow.log_artifact(MODEL_PKL_PATH, artifact_path="model")
        print(f"✅ Modelo salvo em: {MODEL_PKL_PATH}")

if __name__ == "__main__":
    train_loan_model()