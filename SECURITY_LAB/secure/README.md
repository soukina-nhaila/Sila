# Version sécurisée (par défaut)
Les corrections sont dans le code principal : `backend/app/{auth,orders,admin,main,core}.py`.
Correspondance vulnérabilité → correction → test : `SECURITY_LAB/documentation/VULNERABILITY_CATALOG.md`.
Vérifier : `bash scripts/test.sh` (les tests `test_secure_*` doivent passer).
