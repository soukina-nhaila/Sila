#!/usr/bin/env bash
# Commande unique pour lancer TOUS les tests (utilise MongoDB simulé en mémoire, aucun service requis)
set -e
cd "$(dirname "$0")/.."
source scripts/activate.sh
cd backend && MONGO_URI=mongomock python -m pytest ../tests -v
