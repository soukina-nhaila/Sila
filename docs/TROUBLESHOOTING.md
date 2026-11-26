# Dépannage
| Problème | Solution |
|---|---|
| `python: command not found` | Essayer `py --version`; installer Python et cocher *Add to PATH*. Le script `setup.sh` essaie `python` puis `py`. |
| `bash scripts/...` : `\r: command not found` | Fins de ligne Windows : `sed -i 's/\r$//' scripts/*.sh` |
| Le site affiche « Impossible de joindre l'API » | Le backend n'est pas démarré (http://localhost:8000/api/health). |
| `ServerSelectionTimeoutError` | MongoDB n'est pas démarré : `bash scripts/mongo-docker.sh`. |
| Port 3000/8000/27017 occupé | Fermer l'autre programme ou changer le port. `netstat -ano | findstr :8000` |
| `docker compose` échoue | Lancer Docker Desktop et attendre « Engine running ». |
| Erreur CORS dans le navigateur | `CORS_ORIGINS` dans `.env` doit contenir l'URL du site (`http://localhost:3000`). |
| 429 Trop de tentatives | Limiteur de débit du mode sécurisé : attendre 1 minute. |
| `pip install` échoue sur Windows | Mettre à jour pip : `python -m pip install --upgrade pip`. |
| Connexion impossible | Lancer `bash scripts/seed.sh` ; mot de passe : `Sila@2026`. |
