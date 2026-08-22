import os
import sys
import pandas as pd
import joblib
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
)

def evaluate_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, 'ml', 'model', 'final_model.joblib')
    data_path = os.path.join(base_dir, 'data', 'ml_training_matrix_synthetic.csv')

    if not os.path.exists(model_path):
        print(f"Error: Model file not found at {model_path}. Run train.py first.")
        sys.exit(1)

    pipe = joblib.load(model_path)
    df = pd.read_csv(data_path)

    target_col = 'structural_stall_label'
    id_col = 'synthetic_cnr'

    X = df.drop(columns=[target_col, id_col])
    y = df[target_col]

    probas = pipe.predict_proba(X)[:, 1]
    threshold = 0.40
    preds = (probas >= threshold).astype(int)

    acc = accuracy_score(y, preds)
    prec = precision_score(y, preds)
    rec = recall_score(y, preds)
    f1 = f1_score(y, preds)
    auc = roc_auc_score(y, probas)
    cm = confusion_matrix(y, preds)

    print("--- Full Dataset Evaluation (Threshold = 0.40) ---")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print(f"ROC-AUC:   {auc:.4f}")
    print("Confusion Matrix:")
    print(cm)

if __name__ == '__main__':
    evaluate_model()
