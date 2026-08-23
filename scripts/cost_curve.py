"""
scripts/cost_curve.py
Computes expected cost (false-positive cost + false-negative cost)
across a range of classification thresholds, and finds the threshold
that minimizes total expected cost. Saves everything to
data/cost_curve.json.
"""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

MODEL_PATH = Path("data/model.pkl")
TEST_FEATURES_PATH = Path("data/test_features.csv")
OUT_PATH = Path("data/cost_curve.json")

REVIEW_COST = 2.00
AVG_FRAUD_AMOUNT = 50.00
CHARGEBACK_FEE = 15.00

THRESHOLDS = np.arange(0.01, 1.00, 0.01)


def cost_curve():
    bundle = joblib.load(MODEL_PATH)
    model, features = bundle["model"], bundle["features"]

    test_df = pd.read_csv(TEST_FEATURES_PATH)
    X_test = test_df[features]
    y_test = test_df["class"].values
    scores = model.predict_proba(X_test)[:, 1]

    fraud_amounts = test_df.loc[test_df["class"] == 1, "purchase_value"]
    avg_fraud_amount = float(fraud_amounts.mean()) if len(fraud_amounts) else AVG_FRAUD_AMOUNT
    fn_cost_per_case = avg_fraud_amount + CHARGEBACK_FEE

    curve = []
    best = {"threshold": None, "total_cost": float("inf")}

    for t in THRESHOLDS:
        y_pred = (scores >= t).astype(int)

        fp = int(np.sum((y_pred == 1) & (y_test == 0)))
        fn = int(np.sum((y_pred == 0) & (y_test == 1)))
        tp = int(np.sum((y_pred == 1) & (y_test == 1)))

        fp_cost = fp * REVIEW_COST
        fn_cost = fn * fn_cost_per_case
        total_cost = fp_cost + fn_cost

        curve.append({
            "threshold": round(float(t), 2),
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp,
            "fp_cost": round(fp_cost, 2),
            "fn_cost": round(fn_cost, 2),
            "total_cost": round(total_cost, 2),
        })

        if total_cost < best["total_cost"]:
            best = {"threshold": round(float(t), 2), "total_cost": round(total_cost, 2)}

    output = {
        "cost_assumptions": {
            "review_cost_per_false_positive": REVIEW_COST,
            "avg_fraud_amount_per_false_negative": round(avg_fraud_amount, 2),
            "chargeback_fee_per_false_negative": CHARGEBACK_FEE,
            "fn_cost_per_case": round(fn_cost_per_case, 2),
        },
        "optimal_threshold": best["threshold"],
        "optimal_total_cost": best["total_cost"],
        "curve": curve,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Avg fraud amount (from test set): {avg_fraud_amount:.2f}")
    print(f"FN cost per missed case: {fn_cost_per_case:.2f}")
    print(f"Optimal threshold: {best['threshold']} (total cost: {best['total_cost']})")
    print(f"Saved to {OUT_PATH}")


if __name__ == "__main__":
    cost_curve()
