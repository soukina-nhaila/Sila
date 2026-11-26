# Guide Docker
```bash
cp .env.example .env
docker compose up --build         # démarrer
docker compose ps                 # état
docker compose logs -f backend    # logs
docker compose down               # arrêter (-v = supprimer la base)
```
- **mongo** : `mongo:7`, publié sur `127.0.0.1:27017` seulement.
- **backend** : Python 3.12-slim, utilisateur non-root (uid 10001), `cap_drop: ALL`, `no-new-privileges`, limites mémoire/CPU, healthcheck.
- **frontend** : build Next.js « standalone », utilisateur `node`.
- `NEXT_PUBLIC_API_URL` est fixé **au build** (le navigateur appelle `http://localhost:8000`).
- Mode vulnérable : `docker compose -f SECURITY_LAB/vulnerable/docker-compose.vulnerable.yml up --build`.
⚠️ Les fichiers Docker n'ont pas pu être construits dans l'environnement de génération : si une erreur survient, voir `docs/TROUBLESHOOTING.md`.
