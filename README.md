# CoFraud — Enterprise Coordinated Fraud Intelligence

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)

CoFraud is an advanced fraud detection and graph-intelligence platform designed to detect coordinated fraud rings and account sharing patterns across merchant transaction streams. By fusing graph network attributes with temporal transaction signals, CoFraud identifies suspicious clusters and routes them to human reviewers with SHAP risk factor breakdowns.

---

## Key Features

- **Coordinated Ring Explorer**: Dynamic 2D graph network visualization connecting accounts with shared device fingerprints, IP subnets, and billing addresses.
- **Explainable AI (SHAP)**: High-transparency risk breakdowns showing exact positive and negative SHAP feature contributions for every flagged account.
- **Human-in-the-Loop Triage**: Strictly defense-only workflow routing flagged transactions to manual review (Approve, Escalate, Dismiss) without automated blocking.
- **Financial Cost Simulator**: Interactive threshold optimization allowing risk managers to balance chargeback losses against manual review operational costs.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Backend Setup
```bash
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8080
```

### Frontend Setup
```bash
npm install
npm run dev
```
