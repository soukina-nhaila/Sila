# Guide MongoDB — SILA

## 1. Trois façons d'avoir MongoDB
| Option | Quand l'utiliser | `MONGO_URI` |
|---|---|---|
| **Docker** | le plus simple | `mongodb://localhost:27017` |
| **MongoDB local** (Windows) | si installé | `mongodb://localhost:27017` |
| **MongoDB Atlas** (cloud) | partage / démo en ligne | `mongodb+srv://USER:MOTDEPASSE@cluster0.xxxxx.mongodb.net/` |

### Docker
```bash
bash scripts/mongo-docker.sh      # = docker compose up -d mongo
```
### Atlas
1. Créer un compte et un cluster gratuit sur https://www.mongodb.com/atlas.
2. *Database Access* → créer un utilisateur. *Network Access* → ajouter votre IP.
3. *Connect → Drivers* → copier l'URI, la mettre dans `.env` (`MONGO_URI=...`). **Ne jamais committer `.env`.**
### Compass
Ouvrir MongoDB Compass → *New connection* → coller l'URI → *Connect* → base `sila`.

## 2. Initialisation
Les index sont créés automatiquement au démarrage du backend (`ensure_indexes`) et par le seed.
```bash
bash scripts/seed.sh
```
Le seed est **répétable** : il utilise des `upsert` sur des clés naturelles (email, titre, nom, code) → pas de doublons.

## 3. Collections
users, addresses, sellers, restaurants (le menu est un sous-tableau `menu`), couriers, products, categories, product_reviews, restaurant_reviews, carts, orders, shipments, payments, coupons, notifications, wishlists, support_tickets.

Index/contraintes uniques : `users.email`, `sellers.user_id`, `couriers.user_id`, `categories.slug`, `coupons.code`, `carts.user_id`, `wishlists.user_id`.
Références : `ObjectId` (ex. `products.seller_id` → `users._id`). Horodatage : `created_at`.

## 4. Données de démo
11 utilisateurs, 6 catégories, 34 produits, 12 restaurants (4 plats chacun), 3 coupons, 2 commandes (boutique + repas) avec expédition et paiement, avis et notification.
Comptes : voir `INSTALLATION.md` (mot de passe `Sila@2026`).

## 5. Réinitialiser la base
Dans Compass : supprimer la base `sila`, puis `bash scripts/seed.sh`. Avec Docker : `docker compose down -v`.
