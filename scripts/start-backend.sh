#!/usr/bin/env bash
# Usage : bash scripts/start-backend.sh [secure|vulnerable]
set -e
cd "$(dirname "$0")/.."
source scripts/activate.sh
export SILA_MODE="${1:-secure}"
echo ">> Backend en mode : $SILA_MODE  (docs : http://localhost:8000/docs)"
cd backend && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
