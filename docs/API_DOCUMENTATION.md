# API
Documentation interactive complète : **http://localhost:8000/docs** (Swagger, générée automatiquement).
Authentification : `POST /api/auth/login` → `token` → en-tête `Authorization: Bearer <token>`.

| Zone | Endpoints principaux |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `GET /me`, `GET/POST /addresses`, `POST /forgot`, `/reset` |
| Catalogue | `GET /api/products` (q, category, brand, min_price, max_price, sort, page), `/products/suggest`, `/products/{id}`, `/categories` |
| Vendeur | `POST/PUT/DELETE /api/products`, `GET /api/seller/products`, `/seller/stats` |
| Restaurants | `GET /api/restaurants`, `/restaurants/{id}`, `POST /restaurants`, `/restaurants/{id}/meals`, avis |
| Panier | `GET/POST/DELETE /api/cart`, `PUT /api/cart/{index}` |
| Commandes | `POST /api/orders/checkout`, `GET /api/orders`, `/orders/{id}`, `PATCH /orders/{id}/status`, `POST /orders/{id}/refund`, `/orders/{id}/invoice`, `GET /api/tracking/{n°}` |
| Livreur | `GET /api/courier/available`, `POST /api/orders/{id}/assign` |
| Admin | `GET /api/admin/users`, `PATCH /users/{id}/suspend`, `GET /stats`, `POST /coupons`, `GET /tickets` |
| Autres | `GET/POST /api/wishlist`, `POST /api/support`, `GET /api/notifications`, `GET /api/shipping/quote`, `GET /api/health` |
