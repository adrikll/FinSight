import os
import joblib
import pandas as pd
import numpy as np
import mlflow
import mlflow.sklearn

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_auc_score, f1_score, accuracy_score, precision_score, recall_score, classification_report, confusion_matrix
from category_encoders import TargetEncoder

from xgboost import XGBClassifier
from catboost import CatBoostClassifier
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from mlflow.tracking import MlflowClient

from feature_engineering import feature_engineering_avancada
from prepare_loan_dataset import carregar_dataset_loan
from models import EnsembleClassifier

EXPERIMENT_NAME = "FinSight_Loan_Approval_Risk"
MODEL_PKL_PATH = "artifacts/champion_model.pkl"

def feature_engineering_extra(df):
    """Cria interações financeiras profundas para esmagar taxas de falso positivo/negativo."""
    df = df.copy()
    
    if 'monthlydebtpayments' in df.columns and 'monthlyincome' in df.columns:
        df['comprometimento_renda'] = df['monthlydebtpayments'] / (df['monthlyincome'] + 1e-5)
    
    if 'totalassets' in df.columns and 'totalliabilities' in df.columns:
        df['patrimonio_liquido_calc'] = df['totalassets'] - df.get('totalliabilities', 0)
        
    if 'loanamount' in df.columns and 'annualincome' in df.columns:
        df['emprestimo_vs_renda_anual'] = df['loanamount'] / (df['annualincome'] + 1e-5)
        
    if 'savingsaccountbalance' in df.columns and 'checkingaccountbalance' in df.columns and 'monthlydebtpayments' in df.columns:
        soma_saldos = df['savingsaccountbalance'] + df['checkingaccountbalance']
        df['cobertura_liquidez'] = soma_saldos / (df['monthlydebtpayments'] + 1e-5)
        
    return df

def train_loan_model():
    client = MlflowClient()
    experiment = client.get_experiment_by_name(EXPERIMENT_NAME)
    
    if experiment:
        if experiment.lifecycle_stage == "deleted":
            client.restore_experiment(experiment.experiment_id)
        mlflow.set_experiment(EXPERIMENT_NAME)
    else:
        mlflow.create_experiment(EXPERIMENT_NAME)
        mlflow.set_experiment(EXPERIMENT_NAME)

    raw_df = carregar_dataset_loan()
    df = feature_engineering_avancada(raw_df)
    df = feature_engineering_extra(df)

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

    modelos_candidatos = {
        "Regressão Logística": LogisticRegression(max_iter=1000, random_state=42, class_weight='balanced', n_jobs=-1),
        "Random Forest": RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42, class_weight='balanced', n_jobs=-1),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42),
        "CatBoost": CatBoostClassifier(iterations=600, learning_rate=0.02, depth=6, auto_class_weights='Balanced', random_seed=42, verbose=0),
        "XGBoost": XGBClassifier(
            n_estimators=800, 
            learning_rate=0.01, 
            max_depth=4, 
            scale_pos_weight=scale_weight * 1.1,
            subsample=0.85, 
            colsample_bytree=0.85,
            gamma=0.2,
            random_state=42, 
            eval_metric="logloss", 
            n_jobs=-1
        )
    }

    melhor_score_auc = -1
    melhor_pipeline = None
    melhor_nome_modelo = ""
    melhor_metricas = {}
    
    pipelines_treinados = {}

    os.makedirs("artifacts", exist_ok=True)

    # 1. Treinamento e salvamento de métricas individuais de cada modelo no MLflow
    for nome_modelo, estimador in modelos_candidatos.items():
        print(f"\n==================================================")
        print(f"🚀 TREINANDO E AVALIANDO: {nome_modelo}")
        print(f"==================================================")
        
        pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("model", estimador)])
        pipeline.fit(X_train, y_train)
        
        pipelines_treinados[nome_modelo] = pipeline
        
        test_proba = pipeline.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, test_proba)
        gini = (2 * auc) - 1
        
        best_th = 0.5
        max_score_seguro = -1
        
        for th in np.linspace(0.1, 0.9, 200):
            preds = (test_proba >= th).astype(int)
            tn, fp, fn, tp = confusion_matrix(y_test, preds).ravel()
            
            sensibilidade = tp / (tp + fn) if (tp + fn) > 0 else 0
            especificidade = tn / (tn + fp) if (tn + fp) > 0 else 0
            score_seguro = (sensibilidade ** 0.65) * (especificidade ** 0.35)
            
            if score_seguro > max_score_seguro:
                max_score_seguro = score_seguro
                best_th = th

        y_pred = (test_proba >= best_th).astype(int)
        acc = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)

        print(f"📌 Resumo [{nome_modelo}] -> ROC-AUC: {auc:.4f} | Gini: {gini:.4f} | F1: {f1:.4f} | Acc: {acc:.4f} | G-Mean Segura: {max_score_seguro:.4f} | Melhor Threshold: {best_th:.4f}")

        with mlflow.start_run(run_name=f"Run_{nome_modelo.replace(' ', '_')}"):
            mlflow.log_param("model_name", nome_modelo)
            mlflow.log_metrics({
                "auc": auc, "gini": gini, "f1": f1, "accuracy": acc,
                "precision": precision, "recall": recall, "g_mean": max_score_seguro, "best_threshold": best_th
            })
            mlflow.sklearn.log_model(pipeline, artifact_path="model", serialization_format="cloudpickle")

        if auc > melhor_score_auc:
            melhor_score_auc = auc
            melhor_pipeline = pipeline
            melhor_nome_modelo = nome_modelo
            melhor_metricas = {
                "auc": auc, "gini": gini, "f1": f1, "accuracy": acc, 
                "precision": precision, "recall": recall, "g_mean": max_score_seguro, "best_threshold": best_th
            }

    # ==========================================
    # AVALIAÇÃO DE ENSEMBLE (CatBoost + XGBoost)
    # ==========================================
    if "CatBoost" in pipelines_treinados and "XGBoost" in pipelines_treinados:
        print(f"\n==================================================")
        print(f"🌟 AVALIANDO ENSEMBLE PREDITIVO (CatBoost + XGBoost)")
        print(f"==================================================")
        
        pipe_cat = pipelines_treinados["CatBoost"]
        pipe_xgb = pipelines_treinados["XGBoost"]
        
        proba_cat = pipe_cat.predict_proba(X_test)[:, 1]
        proba_xgb = pipe_xgb.predict_proba(X_test)[:, 1]
        
        ensemble_proba = (0.55 * proba_cat) + (0.45 * proba_xgb)
        
        ensemble_auc = roc_auc_score(y_test, ensemble_proba)
        ensemble_gini = (2 * ensemble_auc) - 1
        
        best_th_ens = 0.5
        max_score_seguro_ens = -1
        for th in np.linspace(0.1, 0.9, 200):
            preds = (ensemble_proba >= th).astype(int)
            tn, fp, fn, tp = confusion_matrix(y_test, preds).ravel()
            
            sensibilidade = tp / (tp + fn) if (tp + fn) > 0 else 0
            especificidade = tn / (tn + fp) if (tn + fp) > 0 else 0
            score_seguro = (sensibilidade ** 0.65) * (especificidade ** 0.35)
            
            if score_seguro > max_score_seguro_ens:
                max_score_seguro_ens = score_seguro
                best_th_ens = th

        y_pred_ens = (ensemble_proba >= best_th_ens).astype(int)
        ens_acc = accuracy_score(y_test, y_pred_ens)
        ens_f1 = f1_score(y_test, y_pred_ens, zero_division=0)
        ens_precision = precision_score(y_test, y_pred_ens, zero_division=0)
        ens_recall = recall_score(y_test, y_pred_ens, zero_division=0)

        print(f"📌 Resumo [Ensemble (CatBoost + XGBoost)] -> ROC-AUC: {ensemble_auc:.4f} | Gini: {ensemble_gini:.4f} | F1: {ens_f1:.4f} | Acc: {ens_acc:.4f} | G-Mean Segura: {max_score_seguro_ens:.4f}")

        if ensemble_auc > melhor_score_auc:
            melhor_score_auc = ensemble_auc
            melhor_nome_modelo = "Ensemble (CatBoost + XGBoost)"
            
            melhor_pipeline = EnsembleClassifier(
                model_cat=pipe_cat, 
                model_xgb=pipe_xgb, 
                weight_cat=0.55, 
                weight_xgb=0.45, 
                threshold=best_th_ens
            )
            
            melhor_metricas = {
                "auc": ensemble_auc, "gini": ensemble_gini, "f1": ens_f1, "accuracy": ens_acc, 
                "precision": ens_precision, "recall": ens_recall, "g_mean": max_score_seguro_ens, "best_threshold": best_th_ens
            }

    print(f"\n==========================================")
    print(f"🏆 MODELO VENCEDOR ESCOLHIDO: {melhor_nome_modelo} (AUC: {melhor_score_auc:.4f})")
    print(f"==========================================")

    joblib.dump(melhor_pipeline, MODEL_PKL_PATH)

    # REGISTRO OFICIAL DO ENSEMBLE/CAMPEÃO NO MLFLOW COMO RUN REGULAR
    with mlflow.start_run(run_name="Run_Ensemble_CatBoost_XGBoost"):
        mlflow.log_param("model_name", melhor_nome_modelo)
        for metrica, valor in melhor_metricas.items():
            mlflow.log_metric(metrica, valor)
            
        mlflow.sklearn.log_model(
            melhor_pipeline, 
            artifact_path="model", 
            serialization_format="cloudpickle"
        )
        mlflow.log_artifact(MODEL_PKL_PATH)
        print(f"✅ Modelo campeão salvo e registrado no MLflow em: {MODEL_PKL_PATH}")

if __name__ == "__main__":
    train_loan_model()