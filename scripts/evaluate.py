"""
scripts/evaluate.py
Evaluates the trained model on the held-out (never-seen) temporal test
set. Saves precision, recall, F1, full PR curve, and confusion matrix
to data/evaluation_results.json.
"""

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    precision_recall_curve,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

MODEL_PATH = Path("data/model.pkl")
TEST_FEATURES_PATH = Path("data/test_features.csv")
OUT_PATH = Path("data/evaluation_results.json")

DEFAULT_THRESHOLD = 0.5


def evaluate():
    bundle = joblib.load(MODEL_PATH)
    model, features = bundle["model"], bundle["features"]

    test_df = pd.read_csv(TEST_FEATURES_PATH)
    X_test = test_df[features]
    y_test = test_df["class"]

    y_scores = model.predict_proba(X_test)[:, 1]
    y_pred = (y_scores >= DEFAULT_THRESHOLD).astype(int)

    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    tn, fp, fn, tp = confusion_matrix(y_test, y_pred, labels=[0, 1]).ravel()

    pr_precision, pr_recall, pr_thresholds = precision_recall_curve(y_test, y_scores)

    step = max(len(pr_thresholds) // 200, 1)
    pr_curve = [
        {"threshold": float(t), "precision": float(p), "recall": float(r)}
        for t, p, r in zip(
            pr_thresholds[::step],
            pr_precision[::step],
            pr_recall[::step],
        )
    ]

    results = {
        "threshold_used": DEFAULT_THRESHOLD,
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "confusion_matrix": {
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
            "true_positive": int(tp),
        },
        "test_set_size": int(len(test_df)),
        "test_fraud_count": int(y_test.sum()),
        "pr_curve": pr_curve,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(results, f, indent=2)

    print(f"Precision: {precision:.4f}  Recall: {recall:.4f}  F1: {f1:.4f}")
    print(f"Confusion matrix -> TP: {tp}  FP: {fp}  FN: {fn}  TN: {tn}")
    print(f"Saved to {OUT_PATH}")


if __name__ == "__main__":
    evaluate()
