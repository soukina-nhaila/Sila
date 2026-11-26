# Guide Nagios
Fichiers : `devops/nagios/sila.cfg` (hôte + 3 services : frontend HTTP, API `/api/health`, port MongoDB) et `devops/nagios/docker-compose.nagios.yml`.
```bash
docker compose up -d                                   # SILA doit tourner
docker compose -f devops/nagios/docker-compose.nagios.yml up -d
```
Ouvrir http://localhost:8080 (identifiants par défaut de l'image : voir sa documentation).
Ajouter dans `nagios.cfg` de l'image : `cfg_file=/opt/nagios/etc/objects/sila.cfg`, puis valider et recharger :
```bash
docker exec <conteneur_nagios> /opt/nagios/bin/nagios -v /opt/nagios/etc/nagios.cfg
docker restart <conteneur_nagios>
```
Dépannage : `host.docker.internal` doit être résolvable depuis le conteneur (Docker Desktop : oui). Test manuel : `bash devops/monitoring/check_sila.sh`.
Surveillance des ressources Docker : `docker stats`. Les plugins NRPE ne sont pas configurés (hors périmètre).
⚠️ Configuration **non testée** dans l'environnement de génération.
