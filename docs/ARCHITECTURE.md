# Architecture
Monolithe modulaire : frontend Next.js séparé, backend FastAPI, MongoDB.
```
frontend/ (Next.js 14, TS, Tailwind)  →  HTTP JSON + JWT  →  backend/app/
   auth.py   shop.py   food.py   orders.py   admin.py   (lab.py seulement en mode vulnérable)
                                   ↓ PyMongo
                               MongoDB (17 collections)
```
- Authentification : JWT (HS256, 8 h) dans l'en-tête `Authorization`. Stocké dans `localStorage` côté navigateur (choix pédagogique ; en production, préférer un cookie HttpOnly + protection CSRF).
- RBAC : dépendance `require(*roles)` ; propriété des ressources vérifiée côté serveur (produits, restaurants, commandes).
- Prix, stock, TVA, frais : **toujours recalculés côté serveur**.
- Un checkout « boutique » crée **une commande par vendeur** ; un checkout « repas » est limité à **un restaurant**. Les deux flux sont séparés.
- Transporteurs et paiements : adaptateurs simulés (`orders.py`, `SHIPPING`, `_payment`) ; l'intégration réelle nécessiterait des identifiants fournisseur.
- Tests : `mongomock` remplace MongoDB (`MONGO_URI=mongomock`).
