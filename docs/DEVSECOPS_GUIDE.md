# Guide DevSecOps — SILA

> Commandes à exécuter **localement** sur ce projet. Les sorties dépendent de la version des outils : comparez avant/après.
> Créez un dossier de rapports : `mkdir -p reports`

## 1. Git & GitHub
```bash
git init && git add . && git commit -m "Initial commit"
git checkout -b feature/securite          # branche
git push -u origin feature/securite       # puis Pull Request sur GitHub
git tag v1.0.0 && git push --tags         # release
```
Protection de branche : GitHub → Settings → Branches → *Add rule* (`main`, exiger PR + checks CI).
Conflit : `git merge main` → éditer les marqueurs `<<<<<<<` → `git add` → `git commit`.

## 2. SonarQube (Docker)
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:community
```
Ouvrir http://localhost:9000 (admin/admin, changer le mot de passe) → *Create project* `sila` → générer un token.
```bash
docker run --rm --network host -e SONAR_HOST_URL=http://localhost:9000 -e SONAR_TOKEN=VOTRE_TOKEN \
  -v "$(pwd -W):/usr/src" sonarsource/sonar-scanner-cli -Dsonar.projectKey=sila -Dsonar.sources=backend/app,frontend/app,frontend/components,frontend/lib
```
(Sous Git Bash, `pwd -W` donne le chemin Windows.) Relevez les *Security Hotspots* sur `backend/app/lab.py`, corrigez, relancez, comparez.

## 3. Semgrep
```bash
pip install semgrep
semgrep scan --config auto backend frontend/app --json -o reports/semgrep.json
semgrep scan --config auto backend --sarif -o reports/semgrep.sarif
```
Ou via Docker : `docker run --rm -v "$(pwd -W):/src" semgrep/semgrep semgrep scan --config auto /src/backend`.

## 4. Dépendances / CVE
OWASP Dependency-Check est centré sur l'écosystème Java ; pour Python et npm, utilisez les outils natifs :
```bash
pip install pip-audit && pip-audit -r backend/requirements.txt                 # Python
pip-audit -r SECURITY_LAB/vulnerable/requirements-vulnerable.txt               # version vulnérable (avant)
cd frontend && npm audit                                                       # JavaScript
```
Dependency-Check en mode expérimental (rapport HTML) :
```bash
docker run --rm -v "$(pwd -W):/src" -v "$(pwd -W)/reports:/report" owasp/dependency-check \
  --scan /src/frontend/package-lock.json --format HTML --out /report
```
(Une clé API NVD gratuite accélère beaucoup la première exécution.)

## 5. OWASP ZAP (cible locale uniquement)
```bash
# mode sécurisé ou vulnérable lancé avant
docker run --rm -v "$(pwd -W)/reports:/zap/wrk:rw" -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t http://host.docker.internal:8000/openapi.json -f openapi -r zap-baseline.html
```
Scan authentifié : ouvrez l'interface ZAP, ajoutez l'en-tête `Authorization: Bearer <token>` obtenu via `/api/auth/login` avec un compte de test. Scan actif : **uniquement** sur le mode vulnérable local.

## 6. Docker / Trivy
```bash
docker compose build
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image sila-backend
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image sila-frontend
docker compose exec backend id            # attendu : uid=10001(sila) → non-root
docker inspect $(docker compose ps -q backend) --format '{{.HostConfig.CapDrop}}'
```
(Les noms d'images dépendent du nom du dossier : voir `docker images`.)

## 7. Secrets : Gitleaks
```bash
docker run --rm -v "$(pwd -W):/repo" zricethezav/gitleaks:latest detect --source /repo -v
```

## 8. GitHub Actions
`.github/workflows/ci.yml` (tests, lint, build) et `security.yml` (Semgrep, pip-audit/npm audit, Gitleaks, Trivy). Aucun secret n'est écrit dans les logs ; seul `GITHUB_TOKEN` automatique est utilisé.
⚠️ Ces workflows n'ont pas été exécutés sur GitHub avant livraison : lisez le premier résultat et ajustez si besoin.
