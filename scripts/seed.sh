#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
source scripts/activate.sh
cd backend && python -m app.seed
