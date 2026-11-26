#!/usr/bin/env bash
# Vérification rapide hors Nagios : bash devops/monitoring/check_sila.sh
curl -fsS http://localhost:8000/api/health && echo " <- backend OK" || echo "backend KO"
curl -fsS -o /dev/null http://localhost:3000 && echo "frontend OK" || echo "frontend KO"
docker compose ps 2>/dev/null || true
