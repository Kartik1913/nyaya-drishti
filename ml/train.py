import pandas as pd
import numpy as np
import json
import joblib
import os
import sys

from sklearn.model_selection import StratifiedKFold
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
)
import shap

def run_training_pipeline():
    # 1. Load Data with relative path
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, 'data', 'ml_training_matrix_synthetic.csv')
    real_data_path = os.path.join(base_dir, 'data', 'disposal_time_cleaned.csv')

    df = pd.read_csv(data_path)

    target_col = 'structural_stall_label'
    id_col = 'synthetic_cnr'

    X = df.drop(columns=[target_col, id_col])
    y = df[target_col]

    print("--- Phase 1 & 3: Audit & Class Distribution ---")
    class_counts = y.value_counts().to_dict()
    class_props = y.value_counts(normalize=True).to_dict()
    print(f"Total Cases: {len(df)}")
    print(f"Class Distribution: {class_counts}")
    print(f"Class Proportions: {class_props}")

    # Feature Setup
    cat_cols = ['state', 'district', 'court_establishment', 'case_type', 'tier', 'current_stage']
    num_cols = ['filing_year', 'case_age_days', 'adjournment_count', 'judge_change_count']

    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols)
        ]
    )

    # Calculate scale_pos_weight for imbalance
    neg_count = class_counts[0]
    pos_count = class_counts[1]
    scale_pos_weight = neg_count / pos_count
    print(f"Calculated scale_pos_weight: {scale_pos_weight:.2f}")

    # --- Phase 2 & 4: Case-Level 5-Fold Cross-Validation ---
    print("\n--- Phase 2 & 4: Case-Level 5-Fold Cross-Validation ---")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    candidate_models = {
        'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42),
        'RandomForest': RandomForestClassifier(n_estimators=100, random_state=42),
        'XGBoost_Unweighted': XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=6, random_state=42, eval_metric='logloss'),
        'XGBoost_Weighted': XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=6, scale_pos_weight=scale_pos_weight, random_state=42, eval_metric='logloss')
    }

    cv_results = {}

    for name, clf in candidate_models.items():
        fold_metrics = {'acc': [], 'prec': [], 'rec': [], 'f1': [], 'auc': []}
        
        for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):
            X_train_f, X_val_f = X.iloc[train_idx], X.iloc[val_idx]
            y_train_f, y_val_f = y.iloc[train_idx], y.iloc[val_idx]

            pipe = Pipeline(steps=[
                ('preprocessor', preprocessor),
                ('classifier', clf)
            ])
            pipe.fit(X_train_f, y_train_f)

            preds = pipe.predict(X_val_f)
            probas = pipe.predict_proba(X_val_f)[:, 1]

            fold_metrics['acc'].append(accuracy_score(y_val_f, preds))
            fold_metrics['prec'].append(precision_score(y_val_f, preds, zero_division=0))
            fold_metrics['rec'].append(recall_score(y_val_f, preds))
            fold_metrics['f1'].append(f1_score(y_val_f, preds))
            fold_metrics['auc'].append(roc_auc_score(y_val_f, probas))

        summary = {
            'acc_mean': np.mean(fold_metrics['acc']), 'acc_std': np.std(fold_metrics['acc']),
            'prec_mean': np.mean(fold_metrics['prec']), 'prec_std': np.std(fold_metrics['prec']),
            'rec_mean': np.mean(fold_metrics['rec']), 'rec_std': np.std(fold_metrics['rec']),
            'f1_mean': np.mean(fold_metrics['f1']), 'f1_std': np.std(fold_metrics['f1']),
            'auc_mean': np.mean(fold_metrics['auc']), 'auc_std': np.std(fold_metrics['auc'])
        }
        cv_results[name] = summary
        print(f"[{name}] F1: {summary['f1_mean']:.4f} +/- {summary['f1_std']:.4f} | Rec: {summary['rec_mean']:.4f} +/- {summary['rec_std']:.4f} | Prec: {summary['prec_mean']:.4f} +/- {summary['prec_std']:.4f} | AUC: {summary['auc_mean']:.4f}")

    # Select final model: XGBoost_Weighted (or best balance of recall, F1, AUC)
    selected_model_name = 'XGBoost_Weighted'
    print(f"\nSelected Model for Pipeline: {selected_model_name}")

    # --- Phase 2: Temporal Validation (Train on <=2022, Test on >=2023) ---
    print("\n--- Phase 2: Temporal Validation (Train <=2022, Test >=2023) ---")
    train_temp_mask = X['filing_year'] <= 2022
    test_temp_mask = X['filing_year'] >= 2023

    X_train_temp, X_test_temp = X[train_temp_mask], X[test_temp_mask]
    y_train_temp, y_test_temp = y[train_temp_mask], y[test_temp_mask]

    temp_clf = XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=6, scale_pos_weight=scale_pos_weight, random_state=42, eval_metric='logloss')
    temp_pipe = Pipeline(steps=[('preprocessor', preprocessor), ('classifier', temp_clf)])
    temp_pipe.fit(X_train_temp, y_train_temp)

    temp_preds = temp_pipe.predict(X_test_temp)
    temp_probas = temp_pipe.predict_proba(X_test_temp)[:, 1]

    temporal_results = {
        'train_size': int(len(X_train_temp)),
        'test_size': int(len(X_test_temp)),
        'acc': float(accuracy_score(y_test_temp, temp_preds)),
        'prec': float(precision_score(y_test_temp, temp_preds)),
        'rec': float(recall_score(y_test_temp, temp_preds)),
        'f1': float(f1_score(y_test_temp, temp_preds)),
        'auc': float(roc_auc_score(y_test_temp, temp_probas))
    }
    print(f"Temporal Test Results (2023-2024 Test Set): F1: {temporal_results['f1']:.4f} | Rec: {temporal_results['rec']:.4f} | Prec: {temporal_results['prec']:.4f} | AUC: {temporal_results['auc']:.4f}")

    # --- Full Train/Test (80/20 Case-Level) for Final Model Artifacts & Threshold Analysis ---
    print("\n--- Phase 5: Threshold Optimization & Final Fit ---")
    skf_single = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    train_indices, test_indices = next(skf_single.split(X, y))
    
    X_train, X_test = X.iloc[train_indices], X.iloc[test_indices]
    y_train, y_test = y.iloc[train_indices], y.iloc[test_indices]

    final_clf = XGBClassifier(n_estimators=100, learning_rate=0.1, max_depth=6, scale_pos_weight=scale_pos_weight, random_state=42, eval_metric='logloss')
    final_pipe = Pipeline(steps=[('preprocessor', preprocessor), ('classifier', final_clf)])
    final_pipe.fit(X_train, y_train)

    test_probas = final_pipe.predict_proba(X_test)[:, 1]

    thresholds = [0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70]
    thresh_rows = []

    for t in thresholds:
        t_preds = (test_probas >= t).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_test, t_preds).ravel()
        prec = precision_score(y_test, t_preds, zero_division=0)
        rec = recall_score(y_test, t_preds)
        f1 = f1_score(y_test, t_preds)
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0
        thresh_rows.append({
            'threshold': t,
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1_score': round(f1, 4),
            'fpr': round(fpr, 4),
            'fnr': round(fnr, 4),
            'tp': int(tp), 'fp': int(fp), 'tn': int(tn), 'fn': int(fn)
        })

    thresh_df = pd.DataFrame(thresh_rows)
    print("\nThreshold Analysis:")
    print(thresh_df.to_string(index=False))

    # Recommended threshold: 0.40 (balancing high recall ~85.8% and solid precision ~70.5%)
    chosen_threshold = 0.40
    print(f"\nRecommended Threshold: {chosen_threshold}")

    # --- Phase 6: Explainability (SHAP & Top Features) ---
    print("\n--- Phase 6: SHAP Explainability & Top Features ---")
    cat_feature_names = final_pipe.named_steps['preprocessor'].named_transformers_['cat'].get_feature_names_out(cat_cols)
    all_feature_names = num_cols + list(cat_feature_names)

    X_train_trans = final_pipe.named_steps['preprocessor'].transform(X_train)
    X_test_trans = final_pipe.named_steps['preprocessor'].transform(X_test)

    explainer = shap.TreeExplainer(final_pipe.named_steps['classifier'])
    shap_values = explainer.shap_values(X_test_trans)

    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    feat_imp_df = pd.DataFrame({
        'feature': all_feature_names,
        'importance': final_pipe.named_steps['classifier'].feature_importances_,
        'mean_abs_shap': mean_abs_shap
    }).sort_values('mean_abs_shap', ascending=False)

    print("\nTop 10 Features by SHAP value:")
    print(feat_imp_df.head(10).to_string(index=False))

    # Sample case explanations for 5 test cases
    sample_explanations = []
    test_cases_sample = X_test.iloc[:5]
    test_cnrs = df.iloc[test_indices[:5]][id_col].values

    for i in range(5):
        cnr_val = test_cnrs[i]
        case_raw = test_cases_sample.iloc[i].to_dict()
        case_prob = float(test_probas[i])
        pred_label = 1 if case_prob >= chosen_threshold else 0
        
        # Get top positive SHAP contributors for this case
        c_shap = shap_values[i]
        top_idx = np.argsort(c_shap)[::-1][:3]
        top_factors = [f"{all_feature_names[j]} (+{c_shap[j]:.2f})" for j in top_idx if c_shap[j] > 0]
        
        text_explanation = f"Structural stall probability of {case_prob:.1%} (Risk: {'HIGH' if pred_label == 1 else 'LOW'}). Key driving risk factors: {', '.join(top_factors) if top_factors else 'Normal baseline progression'}."
        sample_explanations.append({
            'cnr': cnr_val,
            'probability': round(case_prob, 4),
            'predicted_stall': pred_label,
            'explanation': text_explanation
        })

    # --- Phase 7: Real Data Generalization Audit ---
    print("\n--- Phase 7: Real Data Compatibility Audit ---")
    real_df = pd.read_csv(real_data_path)
    real_cols = list(real_df.columns)
    
    mapping = {
        'state': 'stateName',
        'court_establishment': 'courtName',
        'case_type': 'caseType',
        'tier': 'tier',
        'filing_year': 'filingYear'
    }
    
    req_feats = list(X.columns)
    available_feats = [f for f in req_feats if f in mapping and mapping[f] in real_cols]
    missing_feats = [f for f in req_feats if f not in available_feats]
    
    print(f"Real Cases Count: {len(real_df)}")
    print(f"Compatible Features: {available_feats}")
    print(f"Missing Required Features: {missing_feats}")
    print("Real-Data Status: Real-data inference blocked by missing event-history features.")

    # --- Save Artifacts & Models ---
    model_dir = os.path.join(base_dir, 'ml', 'model')
    artifacts_dir = os.path.join(base_dir, 'ml', 'artifacts')
    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(artifacts_dir, exist_ok=True)

    # Save final pipeline
    joblib.dump(final_pipe, os.path.join(model_dir, 'final_model.joblib'))
    
    # Save artifacts
    feat_imp_df.to_csv(os.path.join(artifacts_dir, 'feature_importances.csv'), index=False)
    thresh_df.to_csv(os.path.join(artifacts_dir, 'threshold_analysis.csv'), index=False)
    
    # Confusion matrix at recommended threshold 0.40
    opt_preds = (test_probas >= chosen_threshold).astype(int)
    cm = confusion_matrix(y_test, opt_preds)
    cm_df = pd.DataFrame(cm, index=['Actual_0', 'Actual_1'], columns=['Pred_0', 'Pred_1'])
    cm_df.to_csv(os.path.join(artifacts_dir, 'confusion_matrix.csv'))

    with open(os.path.join(artifacts_dir, 'cross_validation_metrics.json'), 'w') as f:
        json.dump(cv_results, f, indent=2)

    metadata = {
        'target_col': target_col,
        'selected_model': selected_model_name,
        'recommended_threshold': chosen_threshold,
        'scale_pos_weight': float(scale_pos_weight),
        'random_seed': 42,
        'num_features': len(X.columns),
        'feature_list': list(X.columns),
        'temporal_validation': temporal_results,
        'sample_case_explanations': sample_explanations
    }
    with open(os.path.join(artifacts_dir, 'model_metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)

    print("\nAll ML models, artifacts, and metadata successfully persisted to ml/model/ and ml/artifacts/.")

if __name__ == '__main__':
    run_training_pipeline()
