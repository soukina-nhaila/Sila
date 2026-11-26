from fastapi import APIRouter, Depends, HTTPException
from .core import get_db, ser, oid, now, require

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require("ADMIN"))])


@router.get("/users")
def users(role: str | None = None):
    f = {"role": role} if role else {}
    return ser(list(get_db().users.find(f).sort("created_at", -1).limit(200)))


@router.patch("/users/{uid}/suspend")
def suspend(uid: str, body: dict):
    s = bool(body.get("suspended", True))
    r = get_db().users.update_one({"_id": oid(uid), "role": {"$ne": "ADMIN"}}, {"$set": {"suspended": s}})
    if r.matched_count == 0:
        raise HTTPException(404, "Utilisateur introuvable ou protégé")
    return {"suspended": s}


@router.get("/stats")
def stats():
    db = get_db()
    paid = [o["total"] for o in db.orders.find({"status": {"$ne": "CANCELLED"}})]
    return {"users": db.users.count_documents({}), "sellers": db.sellers.count_documents({}),
            "restaurants": db.restaurants.count_documents({}), "couriers": db.couriers.count_documents({}),
            "products": db.products.count_documents({}), "orders": db.orders.count_documents({}),
            "revenue": round(sum(paid), 2), "open_tickets": db.support_tickets.count_documents({"status": "OPEN"})}


@router.delete("/products/{pid}", status_code=204)
def remove_product(pid: str):
    get_db().products.delete_one({"_id": oid(pid)})


@router.post("/coupons", status_code=201)
def create_coupon(body: dict):
    code = str(body.get("code", "")).upper().strip()
    pct = int(body.get("percent", 0))
    if not code or not 1 <= pct <= 90:
        raise HTTPException(422, "code et percent (1-90) requis")
    if get_db().coupons.find_one({"code": code}):
        raise HTTPException(409, "Coupon existant")
    get_db().coupons.insert_one({"code": code, "percent": pct, "active": True, "created_at": now()})
    return {"code": code, "percent": pct}


@router.get("/tickets")
def tickets():
    return ser(list(get_db().support_tickets.find().sort("created_at", -1).limit(100)))
