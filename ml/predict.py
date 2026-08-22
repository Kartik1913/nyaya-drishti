import os
import sys
import pandas as pd
import joblib

def predict_stall_risk(input_data, threshold=0.40):
    """
    Accepts a pandas DataFrame or dict containing case features and returns
    predicted structural stall probability, binary prediction, and risk level.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, 'ml', 'model', 'final_model.joblib')

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}. Please run train.py first.")

    pipe = joblib.load(model_path)

    if isinstance(input_data, dict):
        df_input = pd.DataFrame([input_data])
    elif isinstance(input_data, pd.DataFrame):
        df_input = input_data.copy()
    else:
        raise ValueError("input_data must be a dict or a pandas DataFrame.")

    # Drop ID column if present
    if 'synthetic_cnr' in df_input.columns:
        df_input = df_input.drop(columns=['synthetic_cnr'])

    probas = pipe.predict_proba(df_input)[:, 1]
    preds = (probas >= threshold).astype(int)

    results = []
    for p, b in zip(probas, preds):
        results.append({
            'stall_probability': round(float(p), 4),
            'predicted_stall_label': int(b),
            'risk_level': 'HIGH' if b == 1 else 'LOW'
        })

    return results

if __name__ == '__main__':
    # Sample Test Prediction
    sample_case = {
        'state': 'Maharashtra',
        'district': 'Pune',
        'court_establishment': 'DISTRICT AND SESSIONS COURT PUNE MAHARASHTRA',
        'case_type': 'CS',
        'tier': 'district',
        'filing_year': 2021,
        'case_age_days': 1200,
        'current_stage': 'Summons / Appearance',
        'adjournment_count': 12,
        'judge_change_count': 3
    }
    prediction = predict_stall_risk(sample_case)
    print("Sample Inference Result:")
    print(prediction)
