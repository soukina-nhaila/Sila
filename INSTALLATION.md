# 📘 GUIDE D'INSTALLATION SILA (Windows + Git Bash)

> **Suivez ce guide dans l'ordre.** Choisissez **UNE** des deux méthodes : **A (Docker, la plus simple)** ou **B (manuelle, pour développer)**.

## 0. Prérequis

| Outil | Version | Vérifier (dans Git Bash) |
|---|---|---|
| Git for Windows (Git Bash) | récent | `git --version` |
| Python | 3.10 ou plus (3.12 conseillé) | `python --version` (ou `py --version`) |
| Node.js | 20 ou plus | `node --version` et `npm --version` |
| Docker Desktop | récent (méthode A ou MongoDB Docker) | `docker --version` |
| MongoDB Compass (optionnel) | – | pour voir la base |

Pas besoin de WSL.

## 1. Extraire et ouvrir le projet

1. Clic droit sur `sila.zip` → **Extraire tout…** (ex. `C:\Projets\sila`).
2. Ouvrez **Git Bash** dans le dossier : clic droit dans le dossier → *Open Git Bash here*.
3. IntelliJ IDEA : *File → Open →* sélectionner le dossier `sila`. VS Code : `code .`
4. Vérifier :
```bash
ls
# attendu : backend  frontend  database  SECURITY_LAB  devops  docs  tests  scripts  docker-compose.yml ...
```

---

## MÉTHODE A — Tout avec Docker (1 commande)

1. Démarrer **Docker Desktop** (attendre « Engine running »).
2. Dans Git Bash, à la racine du projet :
```bash
cp .env.example .env
docker compose up --build
```
3. Attendre ~3-5 minutes la première fois. Le backend crée automatiquement les données de démonstration.
4. Ouvrir :
   - Site : http://localhost:3000
   - API (Swagger) : http://localhost:8000/docs
   - Santé : http://localhost:8000/api/health → `{"status":"ok","mode":"secure"}`
5. Arrêter : `Ctrl+C` puis `docker compose down` (ajouter `-v` pour effacer la base).

---

## MÉTHODE B — Manuelle (développement)

### Étape 1 — Installer les dépendances (une seule fois)
```bash
bash scripts/setup.sh
```
Cela crée `.env`, l'environnement Python `backend/.venv`, et installe backend + frontend.

### Étape 2 — Démarrer MongoDB
- **Avec Docker (conseillé)** : `bash scripts/mongo-docker.sh` → MongoDB sur `localhost:27017`.
- **MongoDB installé localement** : démarrer le service *MongoDB Server* de Windows.
- **MongoDB Atlas** : voir `database/DATABASE_GUIDE.md`, puis mettre votre URI dans `.env` (`MONGO_URI=...`).

### Étape 3 — Créer les données de démonstration
```bash
bash scripts/seed.sh
# attendu : Seed terminé : {'users': 11, 'products': 34, 'restaurants': 12, 'orders': 2, 'coupons': 3}
```
Vous pouvez relancer cette commande sans danger (pas de doublons).

### Étape 4 — Terminal 1 : le backend
```bash
bash scripts/start-backend.sh
```
Ouvrir http://localhost:8000/docs → l'API doit s'afficher.

### Étape 5 — Terminal 2 : le frontend
Ouvrez un **deuxième** Git Bash dans le dossier du projet :
```bash
bash scripts/start-frontend.sh
```
Ouvrir http://localhost:3000.

### Étape 6 — Lancer les tests
```bash
bash scripts/test.sh
# attendu : 34 passed
```
Les tests utilisent une base MongoDB simulée en mémoire : aucun service à démarrer.

---

## 2. Comptes de démonstration

Mot de passe pour **tous** : `Sila@2026`

| Rôle | Email |
|---|---|
| Administrateur | admin@sila.test |
| Client | customer@sila.test (aussi customer2@, customer3@) |
| Vendeur | seller@sila.test (aussi seller2@, seller3@) |
| Restaurateur | owner@sila.test (aussi owner2@) |
| Livreur | courier@sila.test (aussi courier2@) |

Codes promo : `BIENVENUE10` (-10%), `SILA20` (-20%), `GOLD30` (-30%).

## 3. Scénario de démonstration (5 minutes)

1. **Client** : connectez-vous, cherchez « écouteurs », ajoutez au panier, onglet *Boutique* → adresse → *Commander* (code `SILA20`).
2. **Vendeur** : `seller@sila.test` → *Espace pro* → faire avancer la commande (CONFIRMED → SHIPPED → DELIVERED).
3. **Client** : *Commandes* → suivre l'état et le numéro de suivi.
4. **Repas** : *Restaurants* → un restaurant → ajouter un plat avec suppléments → panier onglet *Repas* → Commander.
5. **Restaurateur** : confirmer → préparer → prêt à récupérer.
6. **Livreur** : accepter la course → récupérer → livrer.
7. **Admin** : statistiques et suspension de compte.

## 4. Mode laboratoire de sécurité (vulnérable)

⚠️ Uniquement en local, avec les données fictives.
```bash
bash scripts/start-backend.sh vulnerable
```
Voir `docs/SECURITY_LAB_GUIDE.md`. Revenir au mode sûr : `bash scripts/start-backend.sh secure`.

## 5. Problèmes fréquents → `docs/TROUBLESHOOTING.md`

## 6. Publier sur GitHub
```bash
git init
git add .
git status          # vérifier qu'aucun .env n'apparaît
git commit -m "Initial commit — SILA"
git branch -M main
git remote add origin https://github.com/VOTRE_COMPTE/sila.git
git push -u origin main
```
Créez d'abord le dépôt vide sur github.com (sans README). Description suggérée : *SILA — Full-stack multi-vendor marketplace and food delivery platform with an intentionally vulnerable DevSecOps security laboratory.*
