"""
scripts/explain.py
Generates:
1. Global feature importance (which features matter most overall)
2. Local SHAP explanations for flagged (predicted-fraud) test accounts,
   used by the Review Queue UI to show "why flagged".
Saves everything to data/shap_explanations.json.
"""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap

MODEL_PATH = Path("data/model.pkl")
TEST_FEATURES_PATH = Path("data/test_features.csv")
OUT_PATH = Path("data/shap_explanations.json")

THRESHOLD = 0.26  # match app/db.py's RISK_THRESHOLD (REVIEW tier and above)
MAX_LOCAL_EXPLANATIONS = 2000  # cover all review-queue-eligible accounts


def explain():
    bundle = joblib.load(MODEL_PATH)
    model, features = bundle["model"], bundle["features"]

    test_df = pd.read_csv(TEST_FEATURES_PATH, dtype={"user_id": str})
    X_test = test_df[features]

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test)

    global_importance = (
        pd.Series(np.abs(shap_values).mean(axis=0), index=features)
        .sort_values(ascending=False)
    )
    global_importance_list = [
        {"feature": feat, "importance": float(val)}
        for feat, val in global_importance.items()
    ]

    scores = model.predict_proba(X_test)[:, 1]

    # Sort by score descending so the highest-risk accounts (the ones
    # the UI shows first in Review Queue / Command Center) get
    # explained, instead of just the first N rows in purchase_time order.
    flagged_order = np.argsort(-scores)
    flagged_idx = flagged_order[scores[flagged_order] >= THRESHOLD][:MAX_LOCAL_EXPLANATIONS]

    local_explanations = {}
    for idx in flagged_idx:
        row_shap = shap_values[idx]
        row_features = X_test.iloc[idx]
        user_id = str(test_df.iloc[idx]["user_id"])

        contrib = sorted(
            zip(features, row_shap, row_features),
            key=lambda t: abs(t[1]),
            reverse=True,
        )[:3]

        local_explanations[user_id] = {
            "risk_score": float(scores[idx]),
            "top_reasons": [
                {
                    "feature": feat,
                    "shap_value": float(val),
                    "feature_value": float(fval),
                }
                for feat, val, fval in contrib
            ],
        }

    output = {
        "global_importance": global_importance_list,
        "local_explanations": local_explanations,
        "threshold_used": THRESHOLD,
        "explained_accounts": len(local_explanations),
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print("Top 5 global features:")
    for item in global_importance_list[:5]:
        print(f"  {item['feature']}: {item['importance']:.4f}")
    print(f"Generated local explanations for {len(local_explanations)} flagged accounts")
    print(f"Saved to {OUT_PATH}")


if __name__ == "__main__":
    explain()
