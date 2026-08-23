"""
app/db.py
Loads the offline pipeline artifacts and seeds a lightweight SQLite
database that the live API reads from.
"""

import json
import sqlite3
from pathlib import Path

import joblib
import pandas as pd

DB_PATH = Path("data/sentinel.db")
MODEL_PATH = Path("data/model.pkl")
TEST_FEATURES_PATH = Path("data/test_features.csv")
CLUSTER_LOOKUP_PATH = Path("data/cluster_lookup.json")
SHAP_PATH = Path("data/shap_explanations.json")
RISK_THRESHOLD = 0.26


def risk_tier(score: float) -> str:
    if score >= 0.6:
        return "HOLD"
    if score >= RISK_THRESHOLD:
        return "REVIEW"
    return "LOW"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.executescript("""
    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS clusters;
    DROP TABLE IF EXISTS review_actions;
    DROP TABLE IF EXISTS audit_log;

    CREATE TABLE accounts (
        user_id TEXT PRIMARY KEY,
        risk_score REAL,
        risk_tier TEXT,
        cluster_id INTEGER,
        cluster_size INTEGER,
        cluster_fraud_rate REAL,
        account_degree REAL,
        purchase_value REAL,
        actual_label INTEGER,
        status TEXT DEFAULT 'Pending'
    );

    CREATE TABLE clusters (
        cluster_id INTEGER PRIMARY KEY,
        size INTEGER,
        fraud_rate REAL,
        member_count INTEGER
    );

    CREATE TABLE review_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        action TEXT,
        timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        action TEXT,
        risk_score REAL,
        cluster_id INTEGER,
        reviewer TEXT,
        timestamp TEXT DEFAULT (datetime('now'))
    );
    """)

    bundle = joblib.load(MODEL_PATH)
    model, features = bundle["model"], bundle["features"]

    test_df = pd.read_csv(TEST_FEATURES_PATH, dtype={"user_id": str})
    test_df["user_id"] = test_df["user_id"].astype(str)
    scores = model.predict_proba(test_df[features])[:, 1]

    with open(CLUSTER_LOOKUP_PATH) as f:
        cluster_lookup = json.load(f)

    cluster_agg = {}

    for i, row in test_df.iterrows():
        uid = row["user_id"]
        score = float(scores[i])
        tier = risk_tier(score)
        cluster_info = cluster_lookup.get(uid, {})
        cluster_id = cluster_info.get("cluster_id", -1)

        cur.execute(
            """INSERT OR REPLACE INTO accounts
               (user_id, risk_score, risk_tier, cluster_id, cluster_size,
                cluster_fraud_rate, account_degree, purchase_value,
                actual_label, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')""",
            (
                uid, score, tier, cluster_id,
                cluster_info.get("cluster_size", 1),
                cluster_info.get("cluster_fraud_rate", 0.0),
                cluster_info.get("account_degree", 0),
                float(row["purchase_value"]),
                int(row["class"]),
            ),
        )

        if cluster_id not in cluster_agg:
            cluster_agg[cluster_id] = {
                "size": cluster_info.get("cluster_size", 1),
                "fraud_rate": cluster_info.get("cluster_fraud_rate", 0.0),
                "member_count": 0,
            }
        cluster_agg[cluster_id]["member_count"] += 1

    for cid, info in cluster_agg.items():
        cur.execute(
            "INSERT OR REPLACE INTO clusters (cluster_id, size, fraud_rate, member_count) VALUES (?, ?, ?, ?)",
            (cid, info["size"], info["fraud_rate"], info["member_count"]),
        )

    conn.commit()
    conn.close()

    print(f"Seeded {len(test_df)} accounts, {len(cluster_agg)} clusters into {DB_PATH}")


if __name__ == "__main__":
    init_db()
