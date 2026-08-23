"""
app/main.py
FastAPI backend for Abuse-Ring Sentinel.
"""

import csv
import io
import json
import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

DB_PATH = Path("data/sentinel.db")
EVAL_PATH = Path("data/evaluation_results.json")
SHAP_PATH = Path("data/shap_explanations.json")
COST_PATH = Path("data/cost_curve.json")

app = FastAPI(title="Abuse-Ring Sentinel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

with open(EVAL_PATH) as f:
    EVALUATION_RESULTS = json.load(f)
with open(SHAP_PATH) as f:
    SHAP_DATA = json.load(f)
with open(COST_PATH) as f:
    COST_CURVE = json.load(f)


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/accounts")
def list_accounts(risk_tier: str | None = None, status: str | None = None, limit: int = 100):
    conn = get_conn()
    query = "SELECT * FROM accounts WHERE 1=1"
    params = []
    if risk_tier:
        query += " AND risk_tier = ?"
        params.append(risk_tier)
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY risk_score DESC LIMIT ?"
    params.append(limit)
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/accounts/{user_id}")
def get_account(user_id: str):
    conn = get_conn()
    row = conn.execute("SELECT * FROM accounts WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Account not found")
    account = dict(row)
    account["shap_explanation"] = SHAP_DATA["local_explanations"].get(user_id)
    return account


@app.get("/clusters")
def list_clusters(min_size: int = 1):
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM clusters WHERE size >= ? ORDER BY fraud_rate DESC", (min_size,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/clusters/{cluster_id}")
def get_cluster(cluster_id: int):
    conn = get_conn()
    cluster = conn.execute("SELECT * FROM clusters WHERE cluster_id = ?", (cluster_id,)).fetchone()
    if not cluster:
        conn.close()
        raise HTTPException(404, "Cluster not found")
    members = conn.execute(
        "SELECT user_id, risk_score, risk_tier, purchase_value FROM accounts WHERE cluster_id = ?",
        (cluster_id,),
    ).fetchall()
    conn.close()
    return {**dict(cluster), "members": [dict(m) for m in members]}


class ReviewAction(BaseModel):
    action: str
    reviewer: str = "Demo User"


@app.get("/review-queue")
def review_queue(limit: int = 100):
    conn = get_conn()
    rows = conn.execute(
        """SELECT * FROM accounts
           WHERE status = 'Pending' AND risk_tier IN ('REVIEW', 'HOLD')
           ORDER BY risk_score DESC LIMIT ?""",
        (limit,),
    ).fetchall()
    conn.close()
    results = []
    for r in rows:
        acc = dict(r)
        acc["shap_explanation"] = SHAP_DATA["local_explanations"].get(acc["user_id"])
        results.append(acc)
    return results


@app.post("/review-queue/{user_id}/action")
def take_action(user_id: str, body: ReviewAction):
    if body.action not in ("approve", "escalate", "dismiss"):
        raise HTTPException(400, "action must be approve, escalate, or dismiss")

    conn = get_conn()
    account = conn.execute("SELECT * FROM accounts WHERE user_id = ?", (user_id,)).fetchone()
    if not account:
        conn.close()
        raise HTTPException(404, "Account not found")

    new_status = {"approve": "Approved", "escalate": "Escalated", "dismiss": "Dismissed"}[body.action]

    conn.execute("UPDATE accounts SET status = ? WHERE user_id = ?", (new_status, user_id))
    conn.execute(
        "INSERT INTO review_actions (user_id, action) VALUES (?, ?)", (user_id, body.action)
    )
    conn.execute(
        """INSERT INTO audit_log (user_id, action, risk_score, cluster_id, reviewer)
           VALUES (?, ?, ?, ?, ?)""",
        (user_id, body.action, account["risk_score"], account["cluster_id"], body.reviewer),
    )
    conn.commit()
    conn.close()

    return {"user_id": user_id, "new_status": new_status}


@app.get("/metrics")
def metrics():
    return EVALUATION_RESULTS


@app.get("/shap-global")
def shap_global():
    return {
        "global_importance": SHAP_DATA["global_importance"],
        "threshold_used": SHAP_DATA["threshold_used"],
    }


@app.get("/shap/{user_id}")
def shap_local(user_id: str):
    explanation = SHAP_DATA["local_explanations"].get(user_id)
    if not explanation:
        raise HTTPException(404, "No SHAP explanation for this account")
    return explanation


@app.get("/cost-curve")
def cost_curve():
    return COST_CURVE


@app.get("/cost-at-threshold")
def cost_at_threshold(t: float):
    for point in COST_CURVE["curve"]:
        if abs(point["threshold"] - round(t, 2)) < 1e-6:
            return point
    raise HTTPException(404, "Threshold not in precomputed curve")


@app.get("/audit-log")
def audit_log(limit: int = 200):
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/audit-log/export")
def audit_log_export():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM audit_log ORDER BY timestamp DESC").fetchall()
    conn.close()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["id", "user_id", "action", "risk_score", "cluster_id", "reviewer", "timestamp"])
    for r in rows:
        writer.writerow([r["id"], r["user_id"], r["action"], r["risk_score"], r["cluster_id"], r["reviewer"], r["timestamp"]])
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_log.csv"},
    )
