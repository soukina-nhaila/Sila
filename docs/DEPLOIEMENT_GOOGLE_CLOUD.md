# Déployer SILA publiquement (Google Cloud Run + MongoDB Atlas)

> ⚠️ **On ne déploie QUE le mode sécurisé.** Le labo vulnérable reste sur votre PC. Le code l'impose : si `SILA_ENV=production` et `SILA_MODE=vulnerable`, le backend **refuse de démarrer**.
> Je n'ai pas pu exécuter ces commandes avec votre compte Google : suivez-les pas à pas et envoyez-moi toute erreur.

## Architecture en ligne
```
Internet ─► Cloud Run « sila-frontend » (Next.js) ─► Cloud Run « sila-backend » (FastAPI) ─► MongoDB Atlas
```
Cloud Run fournit HTTPS automatiquement. Vous payez à l'usage (il existe un quota gratuit, mais un compte de facturation est requis).

## 0. Prérequis
1. Compte Google Cloud + projet + facturation activée : https://console.cloud.google.com
2. Installer **gcloud CLI** : https://cloud.google.com/sdk/docs/install puis, dans Git Bash :
```bash
gcloud auth login
gcloud config set project VOTRE_PROJET_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

## 1. Base MongoDB Atlas (voir aussi `database/DATABASE_GUIDE.md`)
1. Créer un cluster gratuit (M0), un utilisateur de base (mot de passe **long et aléatoire**).
2. *Network Access* : Cloud Run n'a pas d'IP fixe → pour un projet étudiant, autoriser `0.0.0.0/0` **avec** un mot de passe fort (pour restreindre vraiment : VPC + Cloud NAT, option avancée).
3. Copier l'URI `mongodb+srv://...`.

## 2. Secrets
```bash
# secret JWT aléatoire
openssl rand -base64 48 | tr -d '\n' | gcloud secrets create sila-jwt --data-file=-
# URI Atlas
printf '%s' 'mongodb+srv://USER:MOTDEPASSE@cluster0.xxxxx.mongodb.net/' | gcloud secrets create sila-mongo --data-file=-
# autoriser Cloud Run à les lire
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
for s in sila-jwt sila-mongo; do
  gcloud secrets add-iam-policy-binding $s --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role=roles/secretmanager.secretAccessor
done
```

## 3. Backend
```bash
gcloud run deploy sila-backend --source backend --region europe-west1 --allow-unauthenticated \
  --set-env-vars SILA_ENV=production,SILA_MODE=secure,MONGO_DB=sila,CORS_ORIGINS=https://temporaire.example \
  --set-secrets JWT_SECRET=sila-jwt:latest,MONGO_URI=sila-mongo:latest \
  --memory 512Mi --max-instances 3
```
Notez l'URL affichée (ex. `https://sila-backend-xxxx-ew.a.run.app`) → `BACK_URL`. Test : `curl $BACK_URL/api/health` → `{"status":"ok","mode":"secure"}`.

## 4. Frontend
`NEXT_PUBLIC_API_URL` est figé **au moment du build** :
```bash
REGION=europe-west1; PROJ=$(gcloud config get-value project); BACK_URL=https://sila-backend-xxxx-ew.a.run.app
gcloud artifacts repositories create sila --repository-format=docker --location=$REGION
IMAGE=$REGION-docker.pkg.dev/$PROJ/sila/frontend:v1
gcloud builds submit frontend --config frontend/cloudbuild.yaml --substitutions=_IMAGE=$IMAGE,_API_URL=$BACK_URL
gcloud run deploy sila-frontend --image $IMAGE --region $REGION --allow-unauthenticated --port 3000
```
Notez l'URL du frontend → `FRONT_URL`.

## 5. Autoriser le frontend dans le backend (CORS)
```bash
gcloud run services update sila-backend --region europe-west1 --update-env-vars CORS_ORIGINS=$FRONT_URL
```
(Si vous utilisez un domaine perso : `gcloud run domain-mappings create ...` puis mettez ce domaine dans `CORS_ORIGINS`.)

## 6. Initialiser la base de production (depuis votre PC)
```bash
source scripts/activate.sh   # ou activez backend/.venv
cd backend
export MONGO_URI='mongodb+srv://USER:MOTDEPASSE@cluster0.xxxxx.mongodb.net/' SILA_ENV=production
python -m app.seed           # crée seulement les catégories (AUCUN compte de démo en production)
ADMIN_EMAIL=vous@exemple.com python -m app.create_admin   # mot de passe demandé (12+ caractères)
```
Ensuite connectez-vous au site avec cet admin. Les **vrais** vendeurs et restaurateurs s'inscrivent eux-mêmes et ajoutent leurs produits/menus ; le site démarre donc vide de produits (c'est voulu : pas de faux comptes publics avec mot de passe connu).

## 7. Ce que fait le code pour la production
- Refuse de démarrer sans `JWT_SECRET` fort, sans vraie base, ou avec CORS `*`.
- `/docs` désactivé, HSTS activé, en-têtes de sécurité, CORS en liste blanche.
- Aucun compte de démo créé.
- Limite : le limiteur de tentatives de connexion est **en mémoire par instance** (si 3 instances, 3 compteurs). Pour un vrai trafic, utiliser Redis/Memorystore ou Cloud Armor.

## 8. Pour un site vraiment « réel » : ce qui manque encore
Le code est une base complète, mais un commerce réel exige des services externes que **je ne peux pas brancher à votre place** (clés et contrats à votre nom) :
| Besoin | Solution usuelle au Maroc / international |
|---|---|
| Paiement par carte réel | CMI / Payzone (Maroc), Stripe, PayPal — remplacer `_payment()` dans `orders.py` + webhooks |
| Transporteurs | API Amana, Chronopost, DHL, Aramex — remplacer le simulateur `SHIPPING` / `shipments` |
| Photos produits | Google Cloud Storage + champ `image_url` (aujourd'hui : visuels générés) |
| Emails (confirmation, reset mot de passe) | SendGrid / Brevo / Amazon SES |
| Légal | CGV, politique de confidentialité, mentions légales, (Maroc : loi 09-08 / CNDP) |
| Exploitation | sauvegardes Atlas, alertes, domaine personnalisé |

## 9. Atelier DevSecOps → déploiement (flux conseillé)
1. **Local** : `docker compose -f SECURITY_LAB/vulnerable/docker-compose.vulnerable.yml up --build` (127.0.0.1 uniquement).
2. Scanner (Semgrep, ZAP, Trivy, Gitleaks…) → noter les failles dans le catalogue.
3. **Corriger** (le code sécurisé existe déjà : comparez avec `lab.py`) → `bash scripts/test.sh` doit être vert.
4. Pousser sur GitHub → la CI exécute tests + scans.
5. **Déployer seulement la version sécurisée** (étapes 3 à 5 ci-dessus).
Mise à jour ultérieure : relancer `gcloud run deploy ... --source backend` (et le build frontend si l'URL change).
