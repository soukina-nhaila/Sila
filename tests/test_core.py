from conftest import login


def test_health(client):
    assert client.get("/api/health").json()["status"] == "ok"


def test_register_login_me(client):
    r = client.post("/api/auth/register", json={"email": "new@x.com", "password": "Abcdef12", "name": "New User"})
    assert r.status_code == 201
    h = {"Authorization": "Bearer " + r.json()["token"]}
    assert client.get("/api/auth/me", headers=h).json()["email"] == "new@x.com"
    assert "password_hash" not in client.get("/api/auth/me", headers=h).text


def test_duplicate_and_weak_password(client):
    assert client.post("/api/auth/register", json={"email": "customer@sila.test", "password": "Abcdef12", "name": "Dup"}).status_code == 409
    assert client.post("/api/auth/register", json={"email": "w@x.com", "password": "123", "name": "Weak"}).status_code == 422


def test_login_wrong_and_protected(client):
    assert client.post("/api/auth/login", json={"email": "customer@sila.test", "password": "bad"}).status_code == 401
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/orders").status_code == 401


def test_search_filter_sort_pagination(client):
    r = client.get("/api/products?q=écouteurs").json()
    assert r["total"] >= 1
    r = client.get("/api/products?category=sports&sort=price_asc&per_page=3").json()
    prices = [p["price"] for p in r["items"]]
    assert prices == sorted(prices) and len(prices) <= 3
    assert client.get("/api/products?min_price=1000").json()["total"] >= 1
    assert client.get("/api/products").json()["total"] >= 30


def test_restaurants(client):
    r = client.get("/api/restaurants").json()
    assert r["total"] >= 10
    rid = r["items"][0]["id"]
    assert len(client.get(f"/api/restaurants/{rid}").json()["menu"]) >= 4


def test_seller_permissions(client):
    s1, s2 = login(client, "seller@sila.test"), login(client, "seller2@sila.test")
    prod = {"title": "Test Produit", "price": 50, "category": "home", "stock": 5}
    pid = client.post("/api/products", json=prod, headers=s1).json()["id"]
    assert client.put(f"/api/products/{pid}", json=prod, headers=s2).status_code == 403
    assert client.delete(f"/api/products/{pid}", headers=s2).status_code == 403
    assert client.delete(f"/api/products/{pid}", headers=s1).status_code == 204
    assert client.post("/api/products", json=prod, headers=login(client, "customer@sila.test")).status_code == 403
    assert client.post("/api/products", json={**prod, "price": -5}, headers=s1).status_code == 422


def test_admin_permissions(client):
    assert client.get("/api/admin/users").status_code == 401
    assert client.get("/api/admin/users", headers=login(client, "customer@sila.test")).status_code == 403
    assert client.get("/api/admin/stats", headers=login(client, "admin@sila.test")).json()["products"] >= 30


def test_cart_checkout_marketplace(client):
    h = login(client, "customer2@sila.test")
    prods = client.get("/api/products?per_page=2").json()["items"]
    for p in prods:
        assert client.post("/api/cart", json={"kind": "product", "ref_id": p["id"], "qty": 1}, headers=h).status_code == 201
    stock_before = client.get(f"/api/products/{prods[0]['id']}").json()["stock"]
    body = {"kind": "marketplace", "payment_method": "CARD_SIMULATED", "card_last4": "4242", "coupon": "SILA20",
            "address": {"line": "1 rue test", "city": "Larache", "postal_code": "92000", "country": "MA"}}
    r = client.post("/api/orders/checkout", json=body, headers=h)
    assert r.status_code == 201, r.text
    assert client.get(f"/api/products/{prods[0]['id']}").json()["stock"] == stock_before - 1
    assert client.get("/api/cart", headers=h).json()["items"] == []
    o = client.get(f"/api/orders/{r.json()['orders'][0]}", headers=h).json()
    assert o["shipment"]["tracking_number"].startswith("SILA") and o["payment"]["simulated"] is True
    assert client.get(f"/api/tracking/{o['tracking_number']}").json()["status"] == "LABEL_CREATED"
    assert "FACTURE" in client.get(f"/api/orders/{o['id']}/invoice", headers=h).text


def test_international_shipping_costs_more(client):
    assert client.get("/api/shipping/quote?country=FR").json()["fee"] > client.get("/api/shipping/quote?country=MA").json()["fee"]


def test_card_full_number_rejected(client):
    h = login(client, "customer@sila.test")
    p = client.get("/api/products").json()["items"][0]
    client.post("/api/cart", json={"kind": "product", "ref_id": p["id"]}, headers=h)
    body = {"kind": "marketplace", "payment_method": "CARD_SIMULATED", "card_last4": "4242424242424242",
            "address": {"line": "1 rue test", "city": "Larache", "postal_code": "92000", "country": "MA"}}
    assert client.post("/api/orders/checkout", json=body, headers=h).status_code == 422


def test_food_delivery_flow(client):
    cu, ow, co = login(client, "customer@sila.test"), login(client, "owner@sila.test"), login(client, "courier@sila.test")
    r = [x for x in client.get("/api/restaurants").json()["items"]][0]
    full = client.get(f"/api/restaurants/{r['id']}").json()
    m = full["menu"][0]
    for _ in range(3):
        client.post("/api/cart", json={"kind": "meal", "ref_id": r["id"], "meal_id": m["id"], "qty": 2, "addons": ["Sauce maison"]}, headers=cu)
    body = {"kind": "food", "payment_method": "COD", "address": {"line": "1 rue", "city": "Larache", "postal_code": "92000", "country": "MA"}}
    resp = client.post("/api/orders/checkout", json=body, headers=cu)
    assert resp.status_code == 201, resp.text
    oid = resp.json()["orders"][0]
    # propriétaire du restaurant : la bonne personne dépend du seed, on essaie les deux
    owner = ow if client.get(f"/api/orders/{oid}", headers=ow).status_code == 200 else login(client, "owner2@sila.test")
    # ordre interdit
    assert client.patch(f"/api/orders/{oid}/status", json={"status": "PREPARING"}, headers=owner).status_code == 409
    # le client ne peut pas confirmer
    assert client.patch(f"/api/orders/{oid}/status", json={"status": "CONFIRMED"}, headers=cu).status_code == 403
    for s in ("CONFIRMED", "PREPARING", "READY_FOR_PICKUP"):
        assert client.patch(f"/api/orders/{oid}/status", json={"status": s}, headers=owner).status_code == 200
    assert client.patch(f"/api/orders/{oid}/status", json={"status": "PICKED_UP"}, headers=co).status_code == 404  # pas encore assigné
    assert client.post(f"/api/orders/{oid}/assign", headers=co).status_code == 200
    assert client.patch(f"/api/orders/{oid}/status", json={"status": "PICKED_UP"}, headers=owner).status_code == 403
    for s in ("PICKED_UP", "DELIVERED"):
        assert client.patch(f"/api/orders/{oid}/status", json={"status": s}, headers=co).status_code == 200
    final = client.get(f"/api/orders/{oid}", headers=cu).json()
    assert final["status"] == "DELIVERED" and final["payment"]["status"] == "PAID"
    assert [h["status"] for h in final["history"]][-1] == "DELIVERED"


def test_cancel_and_refund(client):
    cu = login(client, "customer3@sila.test")
    p = client.get("/api/products").json()["items"][0]
    client.post("/api/cart", json={"kind": "product", "ref_id": p["id"]}, headers=cu)
    body = {"kind": "marketplace", "payment_method": "CARD_SIMULATED", "card_last4": "1111",
            "address": {"line": "1 rue", "city": "Paris", "postal_code": "75001", "country": "FR"}}
    oid = client.post("/api/orders/checkout", json=body, headers=cu).json()["orders"][0]
    assert client.post(f"/api/orders/{oid}/refund", headers=cu).status_code == 409
    assert client.patch(f"/api/orders/{oid}/status", json={"status": "CANCELLED"}, headers=cu).status_code == 200
    assert client.post(f"/api/orders/{oid}/refund", headers=cu).json()["payment_status"] == "REFUNDED"


def test_food_cart_one_restaurant_only(client):
    cu = login(client, "customer@sila.test")
    for r in client.get("/api/restaurants").json()["items"][:2]:
        m = client.get(f"/api/restaurants/{r['id']}").json()["menu"][0]
        client.post("/api/cart", json={"kind": "meal", "ref_id": r["id"], "meal_id": m["id"], "qty": 5}, headers=cu)
    body = {"kind": "food", "payment_method": "COD", "address": {"line": "1 rue", "city": "Larache", "postal_code": "92000", "country": "MA"}}
    assert client.post("/api/orders/checkout", json=body, headers=cu).status_code == 400


def test_wishlist_and_review(client):
    cu = login(client, "customer@sila.test")
    p = client.get("/api/products").json()["items"][0]["id"]
    assert client.post(f"/api/wishlist/{p}", headers=cu).json()["in_wishlist"] is True
    assert len(client.get("/api/wishlist", headers=cu).json()) == 1
    assert client.post(f"/api/products/{p}/reviews", json={"rating": 4, "comment": "ok"}, headers=cu).status_code == 201


def test_suspended_account_blocked(client):
    ad = login(client, "admin@sila.test")
    uid = [u for u in client.get("/api/admin/users", headers=ad).json() if u["email"] == "customer3@sila.test"][0]["id"]
    client.patch(f"/api/admin/users/{uid}/suspend", json={"suspended": True}, headers=ad)
    assert client.post("/api/auth/login", json={"email": "customer3@sila.test", "password": "Sila@2026"}).status_code == 403


def test_seed_is_idempotent(client):
    from app.db import get_db
    from app import seed
    before = get_db().products.count_documents({})
    seed.run()
    assert get_db().products.count_documents({}) == before
