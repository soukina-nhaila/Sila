# source ce fichier :  source scripts/activate.sh
if [ -f backend/.venv/Scripts/activate ]; then source backend/.venv/Scripts/activate; else source backend/.venv/bin/activate; fi
set -a; [ -f .env ] && source .env; set +a
