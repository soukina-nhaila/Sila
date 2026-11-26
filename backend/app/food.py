import re
import uuid
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from .core import get_db, ser, oid, now, current_user, require

router = APIRouter(prefix="/api", tags=["restaurants"])


class AddonIn(BaseModel):
    name: str
    price: float = Field(ge=0, le=1000)


class MealIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str = Field(default="", max_length=500)
    price: float = Field(gt=0, lt=10000)
    emoji: str = "🍽️"
    addons: list[AddonIn] = []


class RestaurantIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    category: str
    description: str = Field(default="", max_length=800)
    city: str = "Larache"
    delivery_fee: float = Field(default=10, ge=0, le=200)
    min_order: float = Field(default=40, ge=0, le=1000)
    prep_minutes: int = Field(default=25, ge=5, le=180)
    open_hours: str = "10:00-23:00"
    emoji: str = "🍴"


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=1000)


@router.get("/restaurant-categories")
def rcats():
    return ["Pizza", "Burgers", "Tacos", "Sandwiches", "Traditionnel", "Desserts", "Boulangerie", "Café", "Fast food", "Snack"]


@router.get("/restaurants")
def list_restaurants(q: str | None = None, category: str | None = None, page: int = Query(1, ge=1),
                     per_page: int = Query(12, ge=1, le=50)):
    f: dict = {}
    if q:
        f["name"] = {"$regex": re.escape(q), "$options": "i"}
    if category:
        f["category"] = category
    col = get_db().restaurants
    total = col.count_documents(f)
    rows = col.find(f, {"menu": 0}).sort("rating_avg", -1).skip((page - 1) * per_page).limit(per_page)
    return {"items": ser(list(rows)), "total": total, "page": page}


@router.get("/restaurants/mine")
def my_restaurant(u=Depends(require("RESTAURANT_OWNER"))):
    return ser(list(get_db().restaurants.find({"owner_id": u["_id"]})))


@router.get("/restaurants/{rid}")
def restaurant_detail(rid: str):
    db = get_db()
    r = db.restaurants.find_one({"_id": oid(rid)})
    if not r:
        raise HTTPException(404, "Restaurant introuvable")
    reviews = list(db.restaurant_reviews.find({"restaurant_id": r["_id"]}).sort("created_at", -1).limit(20))
    return {**ser(r), "reviews": ser(reviews)}


@router.post("/restaurants", status_code=201)
def create_restaurant(body: RestaurantIn, u=Depends(require("RESTAURANT_OWNER"))):
    doc = body.model_dump() | {"owner_id": u["_id"], "menu": [], "rating_avg": 0, "rating_count": 0,
                               "is_open": True, "created_at": now()}
    doc["_id"] = get_db().restaurants.insert_one(doc).inserted_id
    return ser(doc)


def own_restaurant(rid, u):
    r = get_db().restaurants.find_one({"_id": oid(rid)})
    if not r:
        raise HTTPException(404, "Restaurant introuvable")
    if r["owner_id"] != u["_id"]:
        raise HTTPException(403, "Ce restaurant appartient à un autre propriétaire")
    return r


@router.post("/restaurants/{rid}/meals", status_code=201)
def add_meal(rid: str, body: MealIn, u=Depends(require("RESTAURANT_OWNER"))):
    own_restaurant(rid, u)
    meal = body.model_dump() | {"id": uuid.uuid4().hex[:12]}
    get_db().restaurants.update_one({"_id": oid(rid)}, {"$push": {"menu": meal}})
    return meal


@router.delete("/restaurants/{rid}/meals/{mid}", status_code=204)
def delete_meal(rid: str, mid: str, u=Depends(require("RESTAURANT_OWNER"))):
    own_restaurant(rid, u)
    get_db().restaurants.update_one({"_id": oid(rid)}, {"$pull": {"menu": {"id": mid}}})


@router.post("/restaurants/{rid}/reviews", status_code=201)
def review_restaurant(rid: str, body: ReviewIn, u=Depends(current_user)):
    db = get_db()
    r = db.restaurants.find_one({"_id": oid(rid)})
    if not r:
        raise HTTPException(404, "Restaurant introuvable")
    db.restaurant_reviews.insert_one({"restaurant_id": r["_id"], "user_id": u["_id"], "user_name": u["name"],
                                      "rating": body.rating, "comment": body.comment, "created_at": now()})
    rs = [x["rating"] for x in db.restaurant_reviews.find({"restaurant_id": r["_id"]})]
    db.restaurants.update_one({"_id": r["_id"]}, {"$set": {"rating_avg": round(sum(rs) / len(rs), 2), "rating_count": len(rs)}})
    return {"ok": True}
