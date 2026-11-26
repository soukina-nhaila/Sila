import secrets
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from fastapi.responses import PlainTextResponse
from .core import get_db, ser, oid, now, current_user, require, notify
from .shop import final_price

router = APIRouter(prefix="/api", tags=["cart-orders"])

TAX_RATE = 0.20  # TVA incluse dans les prix
SHIPPING = {  # configurable : (frais MAD, délai)
    "national": {"standard": (30, "2-4 jours"), "express": (60, "24 heures")},
    "international": {"standard": (150, "7-15 jours"), "express": (300, "3-5 jours")},
}
FREE_NATIONAL_OVER = 500
HOME_COUNTRY = "MA"

FOOD_FLOW = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "PICKED_UP", "DELIVERED"]
SHOP_FLOW = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"]


class CartAdd(BaseModel):
    kind: str  # product | meal
    ref_id: str  # product id ou restaurant id
    meal_id: str | None = None
    qty: int = Field(default=1, ge=1, le=50)
    addons: list[str] = []


class AddressIn(BaseModel):
    line: str = Field(min_length=3, max_length=200)
    city: str = Field(min_length=2, max_length=80)
    postal_code: str = Field(min_length=2, max_length=12)
    country: str = Field(default="MA", min_length=2, max_length=2)


class CheckoutIn(BaseModel):
    kind: str  # marketplace | food
    payment_method: str = "COD"  # COD | CARD_SIMULATED
    card_last4: str | None = Field(default=None, pattern=r"^\d{4}$")
    address: AddressIn
    shipping_method: str = "standard"
    coupon: str | None = None


class StatusIn(BaseModel):
    status: str


def _cart(uid):
    return get_db().carts.find_one({"user_id": uid}) or {"user_id": uid, "items": []}


def _enrich(items):
    db = get_db()
    out = []
    for it in items:
        if it["kind"] == "product":
            p = db.products.find_one({"_id": it["ref_id"]})
            if not p:
                continue
            out.append({**it, "name": p["title"], "unit_price": final_price(p), "emoji": p.get("emoji", "📦"),
                        "seller_id": p["seller_id"], "stock": p["stock"]})
        else:
            r = db.restaurants.find_one({"_id": it["ref_id"]})
            m = next((x for x in (r or {}).get("menu", []) if x["id"] == it.get("meal_id")), None)
            if not r or not m:
                continue
            addons = [a for a in m.get("addons", []) if a["name"] in it.get("addons", [])]
            unit = round(m["price"] + sum(a["price"] for a in addons), 2)
            out.append({**it, "name": m["name"], "unit_price": unit, "emoji": m.get("emoji", "🍽️"),
                        "restaurant_id": r["_id"], "restaurant_name": r["name"]})
    return out


@router.get("/cart")
def get_cart(u=Depends(current_user)):
    items = _enrich(_cart(u["_id"])["items"])
    return {"items": ser(items), "subtotal_products": round(sum(i["unit_price"] * i["qty"] for i in items if i["kind"] == "product"), 2),
            "subtotal_meals": round(sum(i["unit_price"] * i["qty"] for i in items if i["kind"] == "meal"), 2)}


@router.post("/cart", status_code=201)
def add_to_cart(body: CartAdd, u=Depends(current_user)):
    db = get_db()
    ref = oid(body.ref_id)
    if body.kind == "product":
        p = db.products.find_one({"_id": ref})
        if not p:
            raise HTTPException(404, "Produit introuvable")
        if p["stock"] < body.qty:
            raise HTTPException(400, "Stock insuffisant")
        key = {"kind": "product", "ref_id": ref}
        item = {**key, "qty": body.qty}
    elif body.kind == "meal":
        r = db.restaurants.find_one({"_id": ref})
        if not r or not any(m["id"] == body.meal_id for m in r["menu"]):
            raise HTTPException(404, "Plat introuvable")
        key = {"kind": "meal", "ref_id": ref, "meal_id": body.meal_id, "addons": sorted(body.addons)}
        item = {**key, "qty": body.qty}
    else:
        raise HTTPException(400, "kind invalide")
    cart = _cart(u["_id"])
    for it in cart["items"]:
        if all(it.get(k) == v for k, v in key.items()):
            it["qty"] = min(50, it["qty"] + body.qty)
            break
    else:
        cart["items"].append(item)
    db.carts.update_one({"user_id": u["_id"]}, {"$set": {"items": cart["items"]}}, upsert=True)
    return {"ok": True}


@router.put("/cart/{index}")
def set_qty(index: int, body: dict, u=Depends(current_user)):
    cart = _cart(u["_id"])
    if not 0 <= index < len(cart["items"]):
        raise HTTPException(404, "Ligne introuvable")
    q = int(body.get("qty", 1))
    if q <= 0:
        cart["items"].pop(index)
    else:
        cart["items"][index]["qty"] = min(q, 50)
    get_db().carts.update_one({"user_id": u["_id"]}, {"$set": {"items": cart["items"]}})
    return {"ok": True}


@router.delete("/cart")
def clear_cart(u=Depends(current_user)):
    get_db().carts.update_one({"user_id": u["_id"]}, {"$set": {"items": []}}, upsert=True)
    return {"ok": True}


@router.get("/coupons/{code}")
def check_coupon(code: str, u=Depends(current_user)):
    c = get_db().coupons.find_one({"code": code.upper(), "active": True})
    if not c:
        raise HTTPException(404, "Coupon invalide")
    return {"code": c["code"], "percent": c["percent"]}


@router.get("/shipping/quote")
def quote(country: str = "MA", method: str = "standard", subtotal: float = 0):
    zone = "national" if country.upper() == HOME_COUNTRY else "international"
    if method not in SHIPPING[zone]:
        raise HTTPException(400, "Méthode inconnue")
    fee, eta = SHIPPING[zone][method]
    if zone == "national" and subtotal >= FREE_NATIONAL_OVER and method == "standard":
        fee = 0
    return {"zone": zone, "fee": fee, "eta": eta, "carrier": "SILA-SIM (simulation, aucun transporteur réel)"}


def _payment(order_id, user_id, amount, body):
    status = "PAID" if body.payment_method == "CARD_SIMULATED" else "PENDING"
    p = {"order_id": order_id, "user_id": user_id, "amount": amount, "method": body.payment_method,
         "status": status, "simulated": True, "card_last4": body.card_last4 if body.payment_method == "CARD_SIMULATED" else None,
         "created_at": now()}
    return get_db().payments.insert_one(p).inserted_id


@router.post("/orders/checkout", status_code=201)
def checkout(body: CheckoutIn, u=Depends(require("CUSTOMER"))):
    if body.payment_method not in ("COD", "CARD_SIMULATED"):
        raise HTTPException(400, "Méthode de paiement invalide")
    if body.payment_method == "CARD_SIMULATED" and not body.card_last4:
        raise HTTPException(422, "card_last4 requis (jamais le numéro complet)")
    db = get_db()
    cart = _cart(u["_id"])
    items = _enrich(cart["items"])
    want = "product" if body.kind == "marketplace" else "meal" if body.kind == "food" else None
    if not want:
        raise HTTPException(400, "kind doit être marketplace ou food")
    sel = [i for i in items if i["kind"] == want]
    if not sel:
        raise HTTPException(400, "Panier vide pour ce type de commande")
    pct = 0
    if body.coupon:
        c = db.coupons.find_one({"code": body.coupon.upper(), "active": True})
        if not c:
            raise HTTPException(400, "Coupon invalide")
        pct = c["percent"]
    created = []
    if want == "product":
        groups = {}
        for i in sel:
            groups.setdefault(i["seller_id"], []).append(i)
        for seller_id, its in groups.items():  # une commande par vendeur
            for i in its:
                r = db.products.update_one({"_id": i["ref_id"], "stock": {"$gte": i["qty"]}},
                                           {"$inc": {"stock": -i["qty"], "sold": i["qty"]}})
                if r.modified_count == 0:
                    raise HTTPException(400, f"Stock insuffisant : {i['name']}")
            sub = round(sum(i["unit_price"] * i["qty"] for i in its), 2)
            disc = round(sub * pct / 100, 2)
            q = quote(body.address.country, body.shipping_method, sub - disc)
            total = round(sub - disc + q["fee"], 2)
            order = {"kind": "marketplace", "customer_id": u["_id"], "seller_id": seller_id,
                     "items": [{k: i[k] for k in ("ref_id", "name", "unit_price", "qty")} for i in its],
                     "subtotal": sub, "discount": disc, "shipping_fee": q["fee"], "tax_included": round(total * TAX_RATE / (1 + TAX_RATE), 2),
                     "total": total, "status": "PENDING", "address": body.address.model_dump(),
                     "history": [{"status": "PENDING", "at": now(), "by": "customer"}], "created_at": now()}
            oidd = db.orders.insert_one(order).inserted_id
            tn = "SILA" + secrets.token_hex(5).upper()
            db.shipments.insert_one({"order_id": oidd, "tracking_number": tn, "zone": q["zone"], "method": body.shipping_method,
                                     "eta": q["eta"], "status": "LABEL_CREATED", "simulated": True, "created_at": now()})
            pid = _payment(oidd, u["_id"], total, body)
            db.orders.update_one({"_id": oidd}, {"$set": {"payment_id": pid, "tracking_number": tn}})
            notify(seller_id, "Nouvelle commande", f"Commande {tn}")
            created.append(str(oidd))
    else:
        rids = {i["restaurant_id"] for i in sel}
        if len(rids) != 1:
            raise HTTPException(400, "Une commande food ne peut concerner qu'un seul restaurant")
        r = db.restaurants.find_one({"_id": rids.pop()})
        sub = round(sum(i["unit_price"] * i["qty"] for i in sel), 2)
        if sub < r["min_order"]:
            raise HTTPException(400, f"Commande minimum : {r['min_order']} MAD")
        disc = round(sub * pct / 100, 2)
        total = round(sub - disc + r["delivery_fee"], 2)
        order = {"kind": "food", "customer_id": u["_id"], "restaurant_id": r["_id"], "restaurant_name": r["name"],
                 "items": [{k: i.get(k) for k in ("meal_id", "name", "unit_price", "qty", "addons")} for i in sel],
                 "subtotal": sub, "discount": disc, "delivery_fee": r["delivery_fee"],
                 "tax_included": round(total * TAX_RATE / (1 + TAX_RATE), 2), "total": total, "status": "PENDING",
                 "address": body.address.model_dump(), "courier_id": None, "eta_minutes": r["prep_minutes"] + 15,
                 "history": [{"status": "PENDING", "at": now(), "by": "customer"}], "created_at": now()}
        oidd = db.orders.insert_one(order).inserted_id
        pid = _payment(oidd, u["_id"], total, body)
        db.orders.update_one({"_id": oidd}, {"$set": {"payment_id": pid}})
        notify(r["owner_id"], "Nouvelle commande food", r["name"])
        created.append(str(oidd))
    # retirer du panier uniquement les lignes commandées
    remaining = [x for x in cart["items"] if x["kind"] != want]
    db.carts.update_one({"user_id": u["_id"]}, {"$set": {"items": remaining}})
    return {"orders": created}


def _visible(o, u):
    r = u["role"]
    if r == "ADMIN":
        return True
    if r == "CUSTOMER":
        return o["customer_id"] == u["_id"]
    if r == "SELLER":
        return o.get("seller_id") == u["_id"]
    if r == "RESTAURANT_OWNER":
        rest = get_db().restaurants.find_one({"_id": o.get("restaurant_id")})
        return bool(rest and rest["owner_id"] == u["_id"])
    if r == "COURIER":
        return o.get("courier_id") == u["_id"]
    return False


@router.get("/orders")
def my_orders(u=Depends(current_user)):
    db = get_db()
    if u["role"] == "ADMIN":
        rows = db.orders.find().sort("created_at", -1).limit(100)
    elif u["role"] == "CUSTOMER":
        rows = db.orders.find({"customer_id": u["_id"]}).sort("created_at", -1)
    elif u["role"] == "SELLER":
        rows = db.orders.find({"seller_id": u["_id"]}).sort("created_at", -1)
    elif u["role"] == "RESTAURANT_OWNER":
        ids = [r["_id"] for r in db.restaurants.find({"owner_id": u["_id"]})]
        rows = db.orders.find({"restaurant_id": {"$in": ids}}).sort("created_at", -1)
    else:
        rows = db.orders.find({"courier_id": u["_id"]}).sort("created_at", -1)
    return ser(list(rows))


@router.get("/orders/{order_id}")
def order_detail(order_id: str, u=Depends(current_user)):
    db = get_db()
    o = db.orders.find_one({"_id": oid(order_id)})
    if not o or not _visible(o, u):
        raise HTTPException(404, "Commande introuvable")  # 404 pour ne pas révéler l'existence
    out = ser(o)
    out["shipment"] = ser(db.shipments.find_one({"order_id": o["_id"]}))
    out["payment"] = ser(db.payments.find_one({"order_id": o["_id"]}))
    return out


@router.patch("/orders/{order_id}/status")
def change_status(order_id: str, body: StatusIn, u=Depends(current_user)):
    db = get_db()
    o = db.orders.find_one({"_id": oid(order_id)})
    if not o or not _visible(o, u):
        raise HTTPException(404, "Commande introuvable")
    new, cur, role = body.status, o["status"], u["role"]
    if new == "CANCELLED":
        if role == "CUSTOMER" and cur == "PENDING" or role == "ADMIN" and cur not in ("DELIVERED", "CANCELLED"):
            pass
        elif role in ("SELLER", "RESTAURANT_OWNER") and cur in ("PENDING", "CONFIRMED"):
            pass
        else:
            raise HTTPException(409, "Annulation impossible à ce stade")
    else:
        flow = FOOD_FLOW if o["kind"] == "food" else SHOP_FLOW
        if new not in flow or cur not in flow or flow.index(new) != flow.index(cur) + 1:
            raise HTTPException(409, f"Transition {cur} → {new} invalide")
        allowed = {
            "food": {"CONFIRMED": "RESTAURANT_OWNER", "PREPARING": "RESTAURANT_OWNER", "READY_FOR_PICKUP": "RESTAURANT_OWNER",
                     "PICKED_UP": "COURIER", "DELIVERED": "COURIER"},
            "marketplace": {"CONFIRMED": "SELLER", "SHIPPED": "SELLER", "DELIVERED": "SELLER"},
        }[o["kind"]]
        if role != "ADMIN" and allowed[new] != role:
            raise HTTPException(403, "Ce rôle ne peut pas effectuer cette transition")
    upd = {"status": new}
    db.orders.update_one({"_id": o["_id"]}, {"$set": upd, "$push": {"history": {"status": new, "at": now(), "by": role}}})
    if o["kind"] == "marketplace":
        smap = {"SHIPPED": "IN_TRANSIT", "DELIVERED": "DELIVERED", "CANCELLED": "CANCELLED"}
        if new in smap:
            db.shipments.update_one({"order_id": o["_id"]}, {"$set": {"status": smap[new]}})
    if new == "DELIVERED":
        db.payments.update_one({"order_id": o["_id"], "method": "COD"}, {"$set": {"status": "PAID"}})
    notify(o["customer_id"], f"Commande {new}", "")
    return {"status": new}


@router.post("/orders/{order_id}/refund")
def refund(order_id: str, u=Depends(require("CUSTOMER", "ADMIN"))):
    db = get_db()
    o = db.orders.find_one({"_id": oid(order_id)})
    if not o or not _visible(o, u):
        raise HTTPException(404, "Commande introuvable")
    if o["status"] != "CANCELLED":
        raise HTTPException(409, "Seule une commande annulée peut être remboursée")
    pay = db.payments.find_one({"order_id": o["_id"]})
    if pay["status"] == "REFUNDED":
        raise HTTPException(409, "Déjà remboursée")
    new = "REFUNDED" if pay["status"] == "PAID" else "VOID"
    db.payments.update_one({"_id": pay["_id"]}, {"$set": {"status": new, "refunded_at": now()}})
    return {"payment_status": new, "simulated": True}


@router.get("/orders/{order_id}/invoice", response_class=PlainTextResponse)
def invoice(order_id: str, u=Depends(current_user)):
    o = get_db().orders.find_one({"_id": oid(order_id)})
    if not o or not _visible(o, u):
        raise HTTPException(404, "Commande introuvable")
    lines = ["SILA — FACTURE (simulation)", f"Commande : {o['_id']}", f"Date : {o['created_at']:%Y-%m-%d %H:%M}", "-" * 40]
    for i in o["items"]:
        lines.append(f"{i['qty']} x {i['name']:<25} {i['unit_price'] * i['qty']:>9.2f} MAD")
    lines += ["-" * 40, f"Sous-total : {o['subtotal']:.2f} MAD", f"Remise : -{o['discount']:.2f} MAD",
              f"Livraison : {o.get('shipping_fee', o.get('delivery_fee', 0)):.2f} MAD",
              f"Dont TVA 20% : {o['tax_included']:.2f} MAD", f"TOTAL : {o['total']:.2f} MAD"]
    return "\n".join(lines)


@router.get("/tracking/{tracking_number}")
def track(tracking_number: str):
    s = get_db().shipments.find_one({"tracking_number": tracking_number})
    if not s:
        raise HTTPException(404, "Numéro inconnu")
    o = get_db().orders.find_one({"_id": s["order_id"]})
    return {"tracking_number": tracking_number, "status": s["status"], "eta": s["eta"],
            "history": [{"status": h["status"], "at": h["at"].isoformat()} for h in o["history"]]}


# ---------- Livreur ----------
@router.get("/courier/available")
def available(u=Depends(require("COURIER"))):
    rows = get_db().orders.find({"kind": "food", "status": "READY_FOR_PICKUP", "courier_id": None})
    return ser(list(rows))


@router.post("/orders/{order_id}/assign")
def assign(order_id: str, u=Depends(require("COURIER"))):
    r = get_db().orders.update_one({"_id": oid(order_id), "kind": "food", "status": "READY_FOR_PICKUP", "courier_id": None},
                                   {"$set": {"courier_id": u["_id"]}})
    if r.modified_count == 0:
        raise HTTPException(409, "Commande non disponible")
    return {"ok": True}
