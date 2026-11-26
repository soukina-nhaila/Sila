import os
from pymongo import MongoClient, ASCENDING, TEXT

_client = None


def reset_client():
    global _client
    _client = None


def get_db():
    global _client
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    if _client is None:
        if uri == "mongomock":
            import mongomock
            _client = mongomock.MongoClient()
        else:
            _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    return _client[os.getenv("MONGO_DB", "sila")]


COLLECTIONS = [
    "users", "addresses", "sellers", "restaurants", "couriers", "products",
    "categories", "product_reviews", "restaurant_reviews", "carts", "orders",
    "shipments", "payments", "coupons", "notifications", "wishlists",
    "support_tickets",
]


def ensure_indexes():
    db = get_db()
    db.users.create_index("email", unique=True)
    db.sellers.create_index("user_id", unique=True)
    db.couriers.create_index("user_id", unique=True)
    db.categories.create_index("slug", unique=True)
    db.coupons.create_index("code", unique=True)
    db.carts.create_index("user_id", unique=True)
    db.products.create_index([("seller_id", ASCENDING)])
    db.products.create_index([("category", ASCENDING), ("price", ASCENDING)])
    db.restaurants.create_index([("category", ASCENDING)])
    db.orders.create_index([("customer_id", ASCENDING), ("created_at", -1)])
    db.shipments.create_index("tracking_number")
    db.wishlists.create_index("user_id", unique=True)
