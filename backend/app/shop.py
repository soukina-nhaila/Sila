import re
import math
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from .core import get_db, ser, oid, now, current_user, require

router = APIRouter(prefix="/api", tags=["marketplace"])


class ProductIn(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=2000)
    price: float = Field(gt=0, lt=1_000_000)
    discount_pct: int = Field(default=0, ge=0, le=90)
    category: str
    brand: str = "Generic"
    stock: int = Field(default=0, ge=0, le=100000)
    emoji: str = "📦"
    variants: list[str] = []


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=1000)


def final_price(p):
    return round(p["price"] * (1 - p.get("discount_pct", 0) / 100), 2)


def decorate(p):
    d = ser(p)
    d["final_price"] = final_price(p)
    return d


@router.get("/categories")
def categories():
    return ser(list(get_db().categories.find().sort("name", 1)))


@router.get("/products")
def list_products(q: str | None = None, category: str | None = None, brand: str | None = None,
                  min_price: float | None = None, max_price: float | None = None,
                  sort: str = "new", featured: bool | None = None,
                  page: int = Query(1, ge=1), per_page: int = Query(12, ge=1, le=50)):
    f: dict = {}
    if q:
        f["$or"] = [{"title": {"$regex": re.escape(q), "$options": "i"}},
                    {"brand": {"$regex": re.escape(q), "$options": "i"}}]
    if category:
        f["category"] = category
    if brand:
        f["brand"] = brand
    if featured is not None:
        f["featured"] = featured
    if min_price is not None or max_price is not None:
        f["price"] = {}
        if min_price is not None:
            f["price"]["$gte"] = min_price
        if max_price is not None:
            f["price"]["$lte"] = max_price
    order = {"price_asc": ("price", 1), "price_desc": ("price", -1),
             "popular": ("sold", -1), "rating": ("rating_avg", -1)}.get(sort, ("created_at", -1))
    col = get_db().products
    total = col.count_documents(f)
    items = list(col.find(f).sort(*order).skip((page - 1) * per_page).limit(per_page))
    return {"items": [decorate(i) for i in items], "total": total, "page": page,
            "pages": max(1, math.ceil(total / per_page))}


@router.get("/products/suggest")
def suggest(q: str = Query(min_length=1, max_length=40)):
    rows = get_db().products.find({"title": {"$regex": re.escape(q), "$options": "i"}}).limit(6)
    return [{"id": str(r["_id"]), "title": r["title"]} for r in rows]


@router.get("/products/{pid}")
def product_detail(pid: str):
    db = get_db()
    p = db.products.find_one({"_id": oid(pid)})
    if not p:
        raise HTTPException(404, "Produit introuvable")
    seller = db.sellers.find_one({"user_id": p["seller_id"]}) or {}
    reviews = list(db.product_reviews.find({"product_id": p["_id"]}).sort("created_at", -1).limit(20))
    related = list(db.products.find({"category": p["category"], "_id": {"$ne": p["_id"]}}).limit(4))
    return {**decorate(p), "seller": {"store_name": seller.get("store_name")},
            "reviews": ser(reviews), "related": [decorate(r) for r in related]}


@router.post("/products", status_code=201)
def create_product(body: ProductIn, u=Depends(require("SELLER"))):
    doc = body.model_dump() | {"seller_id": u["_id"], "rating_avg": 0, "rating_count": 0,
                               "sold": 0, "featured": False, "created_at": now()}
    doc["_id"] = get_db().products.insert_one(doc).inserted_id
    return decorate(doc)


def own_product(pid, u):
    p = get_db().products.find_one({"_id": oid(pid)})
    if not p:
        raise HTTPException(404, "Produit introuvable")
    if p["seller_id"] != u["_id"]:
        raise HTTPException(403, "Ce produit appartient à un autre vendeur")
    return p


@router.put("/products/{pid}")
def update_product(pid: str, body: ProductIn, u=Depends(require("SELLER"))):
    own_product(pid, u)
    get_db().products.update_one({"_id": oid(pid)}, {"$set": body.model_dump()})
    return decorate(get_db().products.find_one({"_id": oid(pid)}))


@router.delete("/products/{pid}", status_code=204)
def delete_product(pid: str, u=Depends(require("SELLER"))):
    own_product(pid, u)
    get_db().products.delete_one({"_id": oid(pid)})


@router.get("/seller/products")
def my_products(u=Depends(require("SELLER"))):
    return [decorate(p) for p in get_db().products.find({"seller_id": u["_id"]})]


@router.get("/seller/stats")
def seller_stats(u=Depends(require("SELLER"))):
    db = get_db()
    orders = list(db.orders.find({"seller_id": u["_id"], "status": {"$ne": "CANCELLED"}}))
    return {"products": db.products.count_documents({"seller_id": u["_id"]}),
            "orders": len(orders), "revenue": round(sum(o["total"] for o in orders), 2)}


@router.post("/products/{pid}/reviews", status_code=201)
def add_review(pid: str, body: ReviewIn, u=Depends(current_user)):
    db = get_db()
    p = db.products.find_one({"_id": oid(pid)})
    if not p:
        raise HTTPException(404, "Produit introuvable")
    # le commentaire est stocké brut mais l'API renvoie du JSON ; le frontend React échappe par défaut
    db.product_reviews.insert_one({"product_id": p["_id"], "user_id": u["_id"], "user_name": u["name"],
                                   "rating": body.rating, "comment": body.comment, "created_at": now()})
    rs = [r["rating"] for r in db.product_reviews.find({"product_id": p["_id"]})]
    db.products.update_one({"_id": p["_id"]}, {"$set": {"rating_avg": round(sum(rs) / len(rs), 2), "rating_count": len(rs)}})
    return {"ok": True}


@router.get("/wishlist")
def get_wishlist(u=Depends(current_user)):
    db = get_db()
    w = db.wishlists.find_one({"user_id": u["_id"]}) or {"product_ids": []}
    return [decorate(p) for p in db.products.find({"_id": {"$in": w["product_ids"]}})]


@router.post("/wishlist/{pid}")
def toggle_wishlist(pid: str, u=Depends(current_user)):
    db = get_db()
    p = oid(pid)
    w = db.wishlists.find_one({"user_id": u["_id"]})
    if w and p in w["product_ids"]:
        db.wishlists.update_one({"user_id": u["_id"]}, {"$pull": {"product_ids": p}})
        return {"in_wishlist": False}
    db.wishlists.update_one({"user_id": u["_id"]}, {"$addToSet": {"product_ids": p}}, upsert=True)
    return {"in_wishlist": True}


@router.post("/support")
def support_ticket(body: dict, u=Depends(current_user)):
    subject = str(body.get("subject", ""))[:120]
    message = str(body.get("message", ""))[:2000]
    if not subject or not message:
        raise HTTPException(422, "Sujet et message requis")
    get_db().support_tickets.insert_one({"user_id": u["_id"], "subject": subject, "message": message,
                                         "status": "OPEN", "created_at": now()})
    return {"ok": True}


@router.get("/notifications")
def notifications(u=Depends(current_user)):
    return ser(list(get_db().notifications.find({"user_id": u["_id"]}).sort("created_at", -1).limit(30)))
