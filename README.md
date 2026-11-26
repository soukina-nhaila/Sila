# SILA — Shop. Eat. Discover.

![Python](https://img.shields.io/badge/Python-FastAPI-purple) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![MongoDB](https://img.shields.io/badge/MongoDB-7-green) ![Docker](https://img.shields.io/badge/Docker-ready-blue)

SILA est une plateforme **marketplace multi-vendeurs + livraison de repas**, avec un **laboratoire DevSecOps** (mode vulnérable / mode sécurisé). Projet académique.

> ➡️ **Pour démarrer : lisez [`INSTALLATION.md`](INSTALLATION.md).**

## Fonctionnalités implémentées
- Authentification JWT, mots de passe hachés (bcrypt), 5 rôles (CUSTOMER, SELLER, RESTAURANT_OWNER, COURIER, ADMIN), adresses, réinitialisation de mot de passe (démo).
- Marketplace : catalogue, recherche, suggestions, filtres, tri, pagination, promos, stock, avis, favoris, produits similaires.
- Vendeurs : CRUD produits (uniquement les siens), statistiques, commandes.
- Restaurants : 12 restaurants, menus, suppléments, avis, frais de livraison, minimum de commande.
- Panier persistant en base, séparé boutique / repas, coupons, TVA incluse, frais d'expédition national/international (simulation de transporteur), numéros de suivi.
- Commandes boutique (PENDING→CONFIRMED→SHIPPED→DELIVERED) et repas (PENDING→CONFIRMED→PREPARING→READY_FOR_PICKUP→PICKED_UP→DELIVERED), annulation, remboursement **simulé**, facture texte.
- Paiements : à la livraison + carte **simulée** (seuls les 4 derniers chiffres sont acceptés).
- Tableaux de bord vendeur / restaurateur / livreur / admin, notifications, tickets de support (API).
- Interface FR/EN (architecture prête pour l'arabe/RTL, non traduite).
- Labo sécurité : 19 vulnérabilités documentées, version vulnérable isolée + version sécurisée testée.
- DevOps : Docker, Docker Compose, Kubernetes, GitHub Actions, Nagios, configs outils.

## Architecture
```
Navigateur ─► Next.js (3000) ─► FastAPI (8000) ─► MongoDB (27017)
```
Voir `docs/ARCHITECTURE.md`.

## Limites connues (honnêteté)
- Paiements et transporteurs : **simulations**, aucun service réel.
- Images : emojis + dégradés (aucune dépendance externe), pas de photos.
- Upload d'images produit : non implémenté en mode sécurisé (seul le lab vulnérable a un upload, pour l'exercice).
- Certaines pages (profil détaillé, tickets support, wishlist) existent côté API ; l'interface web couvre le parcours principal.
- Arabe/RTL : architecture prête uniquement.

## Licence
MIT — voir `LICENSE`.
