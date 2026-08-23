"""
scripts/load_data.py
Loads the real Kaggle Fraud_Data.csv, engineers the time_since_signup
feature, and sorts by purchase_time so downstream scripts can do a
proper temporal (time-based) train/test split.
"""

import pandas as pd
from pathlib import Path

RAW_PATH = Path("data/raw/Fraud_Data.csv")
OUT_PATH = Path("data/processed_transactions.csv")


def load_data():
    df = pd.read_csv(RAW_PATH)

    df["signup_time"] = pd.to_datetime(df["signup_time"])
    df["purchase_time"] = pd.to_datetime(df["purchase_time"])

    df["time_since_signup_hours"] = (
        df["purchase_time"] - df["signup_time"]
    ).dt.total_seconds() / 3600

    df["device_id"] = df["device_id"].astype(str)
    df["ip_address"] = df["ip_address"].astype(str)
    df["user_id"] = df["user_id"].astype(str)

    df = df.sort_values("purchase_time").reset_index(drop=True)

    return df


if __name__ == "__main__":
    df = load_data()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_PATH, index=False)

    fraud_count = int(df["class"].sum())
    fraud_rate = df["class"].mean() * 100
    print(f"Loaded {len(df)} transactions, {fraud_count} fraud cases ({fraud_rate:.2f}% fraud rate)")
    print(f"Date range: {df['purchase_time'].min()} to {df['purchase_time'].max()}")
    print(f"Saved to {OUT_PATH}")
