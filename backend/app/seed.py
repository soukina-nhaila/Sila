"""Seed répétable (idempotent) : python -m app.seed"""
import os
import random
import secrets
from .db import get_db, ensure_indexes
from .core import hash_pw, now

PASSWORD = "Sila@2026"  # mot de passe de DÉVELOPPEMENT uniquement (données fictives)

USERS = [
    ("admin@sila.test", "Admin SILA", "ADMIN"),
    ("customer@sila.test", "Souka Client", "CUSTOMER"),
    ("customer2@sila.test", "Yassine Client", "CUSTOMER"),
    ("customer3@sila.test", "Lina Client", "CUSTOMER"),
    ("seller@sila.test", "Karim Vendeur", "SELLER"),
    ("seller2@sila.test", "Nadia Vendeuse", "SELLER"),
    ("seller3@sila.test", "Omar Vendeur", "SELLER"),
    ("owner@sila.test", "Hassan Restaurateur", "RESTAURANT_OWNER"),
    ("owner2@sila.test", "Salma Restauratrice", "RESTAURANT_OWNER"),
    ("courier@sila.test", "Mehdi Livreur", "COURIER"),
    ("courier2@sila.test", "Imane Livreuse", "COURIER"),
]

CATEGORIES = [("electronics", "Électronique", "📱"), ("fashion", "Mode", "👗"), ("home", "Maison", "🏠"),
              ("beauty", "Beauté", "💄"), ("sports", "Sport", "⚽"), ("toys", "Jouets", "🧸")]

PRODUCTS = [
    ("Écouteurs Bluetooth Pro", "electronics", "SoundWave", 349, "🎧"), ("Smartphone Nova X", "electronics", "Novatek", 2499, "📱"),
    ("Montre connectée Fit+", "electronics", "FitTime", 599, "⌚"), ("Chargeur rapide 65W", "electronics", "VoltMax", 149, "🔌"),
    ("Enceinte portable Boom", "electronics", "SoundWave", 279, "🔊"), ("Clavier mécanique RGB", "electronics", "KeyForge", 399, "⌨️"),
    ("Veste en cuir élégante", "fashion", "Atlas", 899, "🧥"), ("Sneakers urbaines", "fashion", "StepUp", 549, "👟"),
    ("Robe d'été fleurie", "fashion", "Zahra", 329, "👗"), ("Sac à main premium", "fashion", "Atlas", 699, "👜"),
    ("Lunettes de soleil", "fashion", "Solis", 199, "🕶️"), ("Djellaba moderne", "fashion", "Zahra", 459, "🧕"),
    ("Lampe de bureau LED", "home", "Lumia", 129, "💡"), ("Set de couverts inox", "home", "CasaPlus", 189, "🍴"),
    ("Tapis berbère", "home", "Atlas", 1290, "🧶"), ("Cafetière électrique", "home", "BrewMaster", 459, "☕"),
    ("Aspirateur robot", "home", "CleanBot", 1990, "🤖"), ("Plaid doux en laine", "home", "CasaPlus", 249, "🛋️"),
    ("Huile d'argan bio", "beauty", "ArganOr", 119, "🧴"), ("Parfum Oud Royal", "beauty", "Maison Oud", 799, "🌸"),
    ("Kit maquillage complet", "beauty", "GlamBox", 349, "💄"), ("Sèche-cheveux ionique", "beauty", "StyleAir", 299, "💇"),
    ("Savon noir beldi", "beauty", "ArganOr", 39, "🧼"), ("Ballon de football", "sports", "ProGoal", 139, "⚽"),
    ("Tapis de yoga", "sports", "ZenFit", 159, "🧘"), ("Haltères réglables", "sports", "IronCore", 399, "🏋️"),
    ("Vélo de ville", "sports", "CityRide", 2790, "🚲"), ("Sac de sport", "sports", "ProGoal", 189, "🎒"),
    ("Puzzle 1000 pièces", "toys", "BrainFun", 99, "🧩"), ("Peluche ourson géant", "toys", "Cuddly", 179, "🧸"),
    ("Jeu de construction", "toys", "BlockWorld", 249, "🧱"), ("Voiture télécommandée", "toys", "SpeedKid", 229, "🚗"),
    ("Drone caméra mini", "electronics", "SkyEye", 899, "🚁"), ("Gourde isotherme", "sports", "ZenFit", 89, "🥤"),
]

MEALS = {
    "Pizza": [("Margherita", 45, "🍕"), ("Quatre fromages", 65, "🧀"), ("Pizza poulet", 60, "🍗"), ("Tiramisu", 30, "🍰")],
    "Burgers": [("Cheeseburger", 50, "🍔"), ("Double bacon", 70, "🥓"), ("Burger poulet", 55, "🍗"), ("Frites maison", 20, "🍟")],
    "Tacos": [("Tacos poulet", 40, "🌮"), ("Tacos mixte", 50, "🌯"), ("Tacos viande hachée", 45, "🌮"), ("Nuggets x6", 25, "🍗")],
    "Sandwiches": [("Sandwich thon", 30, "🥪"), ("Panini poulet", 38, "🥪"), ("Sandwich kefta", 35, "🥖"), ("Jus d'orange", 15, "🍊")],
    "Traditionnel": [("Tajine poulet olives", 75, "🍲"), ("Couscous royal", 90, "🥘"), ("Pastilla", 65, "🥧"), ("Thé à la menthe", 12, "🍵")],
    "Desserts": [("Crêpe chocolat", 25, "🥞"), ("Glace artisanale", 20, "🍨"), ("Gaufre fruits", 30, "🧇"), ("Cheesecake", 35, "🍰")],
    "Boulangerie": [("Croissant beurre", 8, "🥐"), ("Pain au chocolat", 9, "🥐"), ("Baguette", 4, "🥖"), ("Msemen", 6, "🫓")],
    "Café": [("Espresso", 12, "☕"), ("Cappuccino", 18, "☕"), ("Café glacé", 22, "🧋"), ("Cookie", 10, "🍪")],
    "Fast food": [("Menu poulet pané", 49, "🍗"), ("Hot-dog", 28, "🌭"), ("Wrap crispy", 38, "🌯"), ("Soda", 10, "🥤")],
    "Snack": [("Sandwich mixte", 25, "🥪"), ("Panini fromage", 30, "🥪"), ("Frites", 15, "🍟"), ("Salade fruits", 20, "🍓")],
}
RESTOS = [("Pizza Napoli", "Pizza", "🍕"), ("Burger House", "Burgers", "🍔"), ("Tacos El Rey", "Tacos", "🌮"),
          ("Chez Sandwich", "Sandwiches", "🥪"), ("Dar Tajine", "Traditionnel", "🍲"), ("Sweet Corner", "Desserts", "🍨"),
          ("Boulangerie Atlas", "Boulangerie", "🥐"), ("Café Larache", "Café", "☕"), ("Crispy Fast", "Fast food", "🍗"),
          ("Snack Océan", "Snack", "🍟"), ("Pizza Roma", "Pizza", "🍕"), ("Grill Burger", "Burgers", "🍔")]


def run():
    random.seed(42)
    ensure_indexes()
    db = get_db()
    if os.getenv("SILA_ENV", "development").lower() == "production":
        # Production : jamais de comptes de démo avec mot de passe connu.
        for slug, name, emoji in CATEGORIES:
            db.categories.update_one({"slug": slug}, {"$setOnInsert": {"name": name, "emoji": emoji}}, upsert=True)
        print("Production : seules les catégories ont été créées. Créez l'admin avec : python -m app.create_admin")
        return
    ids = {}
    for email, name, role in USERS:
        u = db.users.find_one({"email": email})
        if not u:
            iid = db.users.insert_one({"email": email, "password_hash": hash_pw(PASSWORD), "name": name, "role": role,
                                       "suspended": False, "created_at": now()}).inserted_id
            u = {"_id": iid}
        ids[email] = u["_id"]
        if role == "SELLER":
            db.sellers.update_one({"user_id": u["_id"]}, {"$setOnInsert": {"store_name": name.split()[0] + " Store", "created_at": now()}}, upsert=True)
        if role == "COURIER":
            db.couriers.update_one({"user_id": u["_id"]}, {"$setOnInsert": {"available": True, "created_at": now()}}, upsert=True)
    for slug, name, emoji in CATEGORIES:
        db.categories.update_one({"slug": slug}, {"$setOnInsert": {"name": name, "emoji": emoji}}, upsert=True)
    sellers = [ids["seller@sila.test"], ids["seller2@sila.test"], ids["seller3@sila.test"]]
    for n, (title, cat, brand, price, emoji) in enumerate(PRODUCTS):
        db.products.update_one({"title": title}, {"$setOnInsert": {
            "description": f"{title} — produit de qualité de la marque {brand}. Livraison nationale et internationale.",
            "price": float(price), "discount_pct": random.choice([0, 0, 10, 15, 20, 30]), "category": cat, "brand": brand,
            "stock": random.randint(5, 80), "emoji": emoji, "variants": ["Standard", "Premium"], "seller_id": sellers[n % 3],
            "rating_avg": round(random.uniform(3.8, 5), 1), "rating_count": random.randint(3, 120), "sold": random.randint(0, 300),
            "featured": n % 4 == 0, "created_at": now()}}, upsert=True)
    owners = [ids["owner@sila.test"], ids["owner2@sila.test"]]
    for n, (name, cat, emoji) in enumerate(RESTOS):
        menu = [{"id": f"m{n}{i}", "name": m, "description": f"{m} préparé minute", "price": float(p), "emoji": e,
                 "addons": [{"name": "Supplément fromage", "price": 5.0}, {"name": "Sauce maison", "price": 3.0}]}
                for i, (m, p, e) in enumerate(MEALS[cat])]
        db.restaurants.update_one({"name": name}, {"$setOnInsert": {
            "category": cat, "description": f"{name} : {cat.lower()} frais, livré chaud chez vous.", "city": "Larache",
            "delivery_fee": random.choice([8.0, 10.0, 12.0, 15.0]), "min_order": random.choice([20.0, 30.0, 40.0]),
            "prep_minutes": random.choice([10, 15, 20, 25, 30]), "open_hours": "09:00-23:30", "emoji": emoji,
            "owner_id": owners[n % 2], "menu": menu, "rating_avg": round(random.uniform(3.9, 5), 1),
            "rating_count": random.randint(10, 300), "is_open": True, "created_at": now()}}, upsert=True)
    for code, pct in (("BIENVENUE10", 10), ("SILA20", 20), ("GOLD30", 30)):
        db.coupons.update_one({"code": code}, {"$setOnInsert": {"percent": pct, "active": True, "created_at": now()}}, upsert=True)
    cust = ids["customer@sila.test"]
    if db.orders.count_documents({"seeded": True}) == 0:
        p = db.products.find_one({"seller_id": sellers[0]})
        tn = "SILA" + secrets.token_hex(5).upper()
        o1 = db.orders.insert_one({"seeded": True, "kind": "marketplace", "customer_id": cust, "seller_id": p["seller_id"],
                                   "items": [{"ref_id": p["_id"], "name": p["title"], "unit_price": p["price"], "qty": 1}],
                                   "subtotal": p["price"], "discount": 0.0, "shipping_fee": 30.0, "tax_included": round((p["price"] + 30) / 6, 2),
                                   "total": p["price"] + 30, "status": "SHIPPED", "tracking_number": tn,
                                   "address": {"line": "12 Rue Hassan II", "city": "Larache", "postal_code": "92000", "country": "MA"},
                                   "history": [{"status": "PENDING", "at": now(), "by": "customer"}, {"status": "CONFIRMED", "at": now(), "by": "SELLER"},
                                               {"status": "SHIPPED", "at": now(), "by": "SELLER"}], "created_at": now()}).inserted_id
        db.shipments.insert_one({"order_id": o1, "tracking_number": tn, "zone": "national", "method": "standard", "eta": "2-4 jours",
                                 "status": "IN_TRANSIT", "simulated": True, "created_at": now()})
        db.payments.insert_one({"order_id": o1, "user_id": cust, "amount": p["price"] + 30, "method": "CARD_SIMULATED", "status": "PAID",
                                "simulated": True, "card_last4": "4242", "created_at": now()})
        r = db.restaurants.find_one({"owner_id": owners[0]})
        m = r["menu"][0]
        o2 = db.orders.insert_one({"seeded": True, "kind": "food", "customer_id": cust, "restaurant_id": r["_id"], "restaurant_name": r["name"],
                                   "items": [{"meal_id": m["id"], "name": m["name"], "unit_price": m["price"], "qty": 2, "addons": []}],
                                   "subtotal": m["price"] * 2, "discount": 0.0, "delivery_fee": r["delivery_fee"],
                                   "tax_included": round((m["price"] * 2 + r["delivery_fee"]) / 6, 2), "total": m["price"] * 2 + r["delivery_fee"],
                                   "status": "READY_FOR_PICKUP", "courier_id": None, "eta_minutes": 30,
                                   "address": {"line": "12 Rue Hassan II", "city": "Larache", "postal_code": "92000", "country": "MA"},
                                   "history": [{"status": s, "at": now(), "by": "seed"} for s in ("PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP")],
                                   "created_at": now()}).inserted_id
        db.payments.insert_one({"order_id": o2, "user_id": cust, "amount": m["price"] * 2 + r["delivery_fee"], "method": "COD",
                                "status": "PENDING", "simulated": True, "created_at": now()})
    if db.product_reviews.count_documents({"seeded": True}) == 0:
        for p in db.products.find().limit(10):
            db.product_reviews.insert_one({"seeded": True, "product_id": p["_id"], "user_id": cust, "user_name": "Souka Client",
                                           "rating": 5, "comment": "Très bon produit, livraison rapide !", "created_at": now()})
        for r in db.restaurants.find().limit(5):
            db.restaurant_reviews.insert_one({"seeded": True, "restaurant_id": r["_id"], "user_id": cust, "user_name": "Souka Client",
                                              "rating": 5, "comment": "Délicieux et livré chaud.", "created_at": now()})
    db.notifications.update_one({"user_id": cust, "title": "Bienvenue sur SILA !"},
                                {"$setOnInsert": {"body": "Utilisez le code BIENVENUE10.", "read": False, "created_at": now()}}, upsert=True)
    print("Seed terminé :", {c: db[c].count_documents({}) for c in ("users", "products", "restaurants", "orders", "coupons")})


if __name__ == "__main__":
    run()
