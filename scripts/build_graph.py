"""
scripts/build_graph.py
Builds a shared-attribute graph (users connected if they share a
device_id or an ip_address), runs Louvain community detection to find
clusters ("rings"), and computes per-user graph features.

Leakage guard #1: cluster_fraud_rate only uses training-period labels.
Leakage guard #2: a user's OWN label is excluded when computing their
cluster_fraud_rate (leave-one-out) — otherwise singleton clusters
(very common in this dataset) would leak the label directly, since
the "cluster" would just be that one user.
"""

import json
from pathlib import Path

import pandas as pd
import networkx as nx
import community as community_louvain  # from python-louvain

IN_PATH = Path("data/processed_transactions.csv")
OUT_PATH = Path("data/cluster_lookup.json")

TRAIN_SPLIT_QUANTILE = 0.8  # earliest 80% of transactions = train


def add_shared_attribute_edges(G, df, column):
    groups = df.groupby(column)["user_id"].apply(list)
    for _, users in groups.items():
        users = list(set(users))
        if len(users) < 2:
            continue
        for i in range(len(users)):
            for j in range(i + 1, len(users)):
                u, v = users[i], users[j]
                if G.has_edge(u, v):
                    G[u][v]["weight"] += 1
                else:
                    G.add_edge(u, v, weight=1)


def build_graph():
    df = pd.read_csv(IN_PATH, parse_dates=["signup_time", "purchase_time"])
    df = df.sort_values("purchase_time").reset_index(drop=True)
    df["user_id"] = df["user_id"].astype(str)

    split_idx = int(len(df) * TRAIN_SPLIT_QUANTILE)
    split_time = df.iloc[split_idx]["purchase_time"]
    train_df = df[df["purchase_time"] <= split_time]
    print(f"Temporal split at {split_time} -> {len(train_df)} train rows / {len(df) - len(train_df)} test rows")

    G = nx.Graph()
    G.add_nodes_from(df["user_id"])

    add_shared_attribute_edges(G, df, "device_id")
    add_shared_attribute_edges(G, df, "ip_address")

    partition = community_louvain.best_partition(G, weight="weight")

    cluster_users = {}
    for user, cluster_id in partition.items():
        cluster_users.setdefault(cluster_id, []).append(user)

    train_labels = dict(zip(train_df["user_id"], train_df["class"]))
    baseline_rate = float(train_df["class"].mean())  # overall fraud rate, used as neutral default

    lookup = {}
    for user, cluster_id in partition.items():
        users_in_cluster = cluster_users[cluster_id]
        # Leave-one-out: exclude the user's own label from their own
        # cluster_fraud_rate, so singleton/near-singleton clusters
        # don't just echo the user's own answer back as a feature.
        other_train_users = [u for u in users_in_cluster if u in train_labels and u != user]

        if other_train_users:
            rate = sum(train_labels[u] for u in other_train_users) / len(other_train_users)
        else:
            rate = baseline_rate

        lookup[user] = {
            "cluster_id": cluster_id,
            "cluster_size": len(users_in_cluster),
            "cluster_fraud_rate": rate,
            "account_degree": G.degree(user, weight="weight"),
        }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(lookup, f)

    print(f"Graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(cluster_users)} clusters")
    print(f"Baseline fraud rate (used as neutral default): {baseline_rate:.4f}")
    print(f"Saved cluster lookup to {OUT_PATH}")


if __name__ == "__main__":
    build_graph()
