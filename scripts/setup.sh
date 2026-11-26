#!/usr/bin/env bash
# Installation complète (Git Bash / Windows). Usage : bash scripts/setup.sh
set -e
cd "$(dirname "$0")/.."
[ -f .env ] || cp .env.example .env
PY=python; command -v python >/dev/null 2>&1 || PY=py
echo ">> Environnement Python (backend/.venv)"
$PY -m venv backend/.venv
if [ -f backend/.venv/Scripts/activate ]; then source backend/.venv/Scripts/activate; else source backend/.venv/bin/activate; fi
python -m pip install --upgrade pip
pip install -r backend/requirements-dev.txt
echo ">> Dépendances frontend"
[ -f frontend/.env.local ] || cp frontend/.env.example frontend/.env.local
(cd frontend && npm install)
echo ">> Terminé. Étape suivante : démarrer MongoDB, puis bash scripts/seed.sh"
