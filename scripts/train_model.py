"""
scripts/train_model.py
Merges tabular transaction features with the graph features from
build_graph.py, does a strict temporal train/test split (same split
point as build_graph.py), and trains an XGBoost classifier.
"""

import json
from pathlib import Path

import joblib
import pandas as pd
from xgboost import XGBClassifier

TX_PATH = Path("data/processed_transactions.csv")
GRAPH_PATH = Path("data/cluster_lookup.json")
MODEL_PATH = Path("data/model.pkl")
TEST_FEATURES_PATH = Path("data/test_features.csv")

TRAIN_SPLIT_QUANTILE = 0.8  # must match build_graph.py

FEATURES = [
    "purchase_value",
    "age",
    "time_since_signup_hours",
    "source_enc",
    "browser_enc",
    "sex_enc",
    "cluster_size",
    "cluster_fraud_rate",
    "account_degree",
]


def build_features(df, graph_lookup):
    df = df.copy()
    df["user_id"] = df["user_id"].astype(str)

    df["cluster_size"] = df["user_id"].map(lambda u: graph_lookup.get(u, {}).get("cluster_size", 1))
    df["cluster_fraud_rate"] = df["user_id"].map(lambda u: graph_lookup.get(u, {}).get("cluster_fraud_rate", 0.0))
    df["account_degree"] = df["user_id"].map(lambda u: graph_lookup.get(u, {}).get("account_degree", 0))

    df["source_enc"] = df["source"].astype("category").cat.codes
    df["browser_enc"] = df["browser"].astype("category").cat.codes
    df["sex_enc"] = df["sex"].astype("category").cat.codes

    return df


def train():
    df = pd.read_csv(TX_PATH, parse_dates=["signup_time", "purchase_time"])
    df = df.sort_values("purchase_time").reset_index(drop=True)

    with open(GRAPH_PATH) as f:
        graph_lookup = json.load(f)

    df = build_features(df, graph_lookup)

    split_idx = int(len(df) * TRAIN_SPLIT_QUANTILE)
    split_time = df.iloc[split_idx]["purchase_time"]

    train_df = df[df["purchase_time"] <= split_time]
    test_df = df[df["purchase_time"] > split_time]

    X_train, y_train = train_df[FEATURES], train_df["class"]
    X_test, y_test = test_df[FEATURES], test_df["class"]

    pos = max((y_train == 1).sum(), 1)
    neg = (y_train == 0).sum()

    model = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        scale_pos_weight=neg / pos,
        eval_metric="aucpr",
    )
    model.fit(X_train, y_train)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": FEATURES}, MODEL_PATH)

    test_df[FEATURES + ["class", "user_id"]].to_csv(TEST_FEATURES_PATH, index=False)

    print(f"Train: {len(train_df)} rows, {int(y_train.sum())} fraud")
    print(f"Test:  {len(test_df)} rows, {int(y_test.sum())} fraud")
    print(f"Model saved to {MODEL_PATH}")
    print(f"Test features saved to {TEST_FEATURES_PATH}")


if __name__ == "__main__":
    train()
