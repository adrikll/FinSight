import numpy as np

class EnsembleClassifier:
    """Wrapper customizado para encapsular o Ensemble de CatBoost e XGBoost para a API."""
    def __init__(self, model_cat, model_xgb, weight_cat=0.55, weight_xgb=0.45, threshold=0.5):
        self.model_cat = model_cat
        self.model_xgb = model_xgb
        self.weight_cat = weight_cat
        self.weight_xgb = weight_xgb
        self.threshold = threshold
        self.feature_names_in_ = getattr(model_cat, "feature_names_in_", None)

    def predict_proba(self, X):
        proba_cat = self.model_cat.predict_proba(X)[:, 1]
        proba_xgb = self.model_xgb.predict_proba(X)[:, 1]
        p1 = (self.weight_cat * proba_cat) + (self.weight_xgb * proba_xgb)
        p0 = 1.0 - p1
        return np.vstack([p0, p1]).T

    def predict(self, X):
        proba = self.predict_proba(X)[:, 1]
        return (proba >= self.threshold).astype(int)