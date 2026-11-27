"""Tests de régression sécurité : MODE SECURE doit résister, MODE VULNERABLE doit être exploitable (labo)."""
from conftest import login, build
from app.db import get_db


# ---------- SECURE ----------
def test_secure_lab_routes_absent(client):
    assert client.get("/api/lab/config").status_code == 404
    assert client.get("/api/lab/admin/users").status_code == 404


def test_secure_idor_blocked(client):
    cu = login(client, "customer@sila.test")
    other_order = get_db().orders.find_one({"kind": "marketplace"})
    # customer2 essaie de lire la commande de customer
    c2 = login(client, "customer2@sila.test")
    assert client.get(f"/api/orders/{other_order['_id']}", headers=c2).status_code == 404
    assert client.get(f"/api/orders/{other_order['_id']}", headers=cu).status_code == 200


def test_secure_nosql_injection_rejected(client):
    r = client.post("/api/auth/login", json={"email": "admin@sila.test", "password": {"$ne": ""}})
    assert r.status_code == 422
    r = client.post("/api/auth/login", json={"email": {"$ne": ""}, "password": "x"})
    assert r.status_code == 422


def test_secure_mass_assignment_ignored(client):
    r = client.post("/api/auth/register", json={"email": "hack@x.com", "password": "Abcdef12", "name": "Hack", "role": "ADMIN"})
    assert r.status_code == 400
    r = client.post("/api/auth/register", json={"email": "hack2@x.com", "password": "Abcdef12", "name": "Hack", "suspended": False, "role": "CUSTOMER", "is_admin": True})
    assert r.json()["user"]["role"] == "CUSTOMER" and "is_admin" not in r.json()["user"]


def test_secure_rate_limit_login(client):
    codes = [client.post("/api/auth/login", json={"email": "customer@sila.test", "password": "bad"}).status_code for _ in range(12)]
    assert 429 in codes


def test_secure_headers_and_cors(client):
    r = client.get("/api/health", headers={"Origin": "http://evil.example"})
    assert r.headers["x-content-type-options"] == "nosniff" and r.headers["x-frame-options"] == "DENY"
    assert r.headers.get("access-control-allow-origin") != "*"


def test_secure_no_password_hash_leak(client):
    ad = login(client, "admin@sila.test")
    assert "password_hash" not in client.get("/api/admin/users", headers=ad).text


def test_secure_xss_payload_is_json_not_html(client):
    r = client.get("/api/products/suggest?q=<script>")
    assert r.headers["content-type"].startswith("application/json")


# ---------- VULNERABLE ----------
def test_lab_idor(lab_client):
    o = get_db().orders.find_one({"kind": "marketplace"})
    assert lab_client.get(f"/api/lab/orders/{o['_id']}").status_code == 200  # sans token !


def test_lab_nosql_injection(lab_client):
    r = lab_client.post("/api/lab/login", json={"email": "admin@sila.test", "password": {"$ne": ""}})
    assert r.status_code == 200 and r.json()["user"]["role"] == "ADMIN"


def test_lab_reflected_xss(lab_client):
    assert "<script>alert(1)</script>" in lab_client.get("/api/lab/search?q=<script>alert(1)</script>").text


def test_lab_stored_xss(lab_client):
    lab_client.post("/api/lab/reviews", json={"author": "a", "comment": "<img src=x onerror=alert(1)>"})
    assert "<img src=x onerror=alert(1)>" in lab_client.get("/api/lab/reviews").text


def test_lab_mass_assignment(lab_client):
    r = lab_client.post("/api/lab/register", json={"email": "evil@x.com", "password": "1", "name": "E", "role": "ADMIN"})
    assert r.json()["role"] == "ADMIN"


def test_lab_broken_access_and_exposure(lab_client):
    r = lab_client.get("/api/lab/admin/users")
    assert r.status_code == 200 and "password_hash" in r.text
    assert "jwt_secret" in lab_client.get("/api/lab/config").json()


def test_lab_negative_price(lab_client):
    assert lab_client.post("/api/lab/products", json={"title": "x", "price": -10}).status_code == 200


def test_lab_cors_wildcard(lab_client):
    r = lab_client.get("/api/health", headers={"Origin": "http://evil.example"})
    assert r.headers.get("access-control-allow-origin") == "*"
    assert "x-frame-options" not in r.headers


def test_lab_refuses_production(monkeypatch):
    import pytest
    monkeypatch.setenv("SILA_MODE", "vulnerable")
    monkeypatch.setenv("SILA_ENV", "production")
    from app.main import create_app
    with pytest.raises(RuntimeError):
        create_app()


# ---------- PRODUCTION ----------
def test_production_requires_strong_secret(monkeypatch):
    import pytest
    from app.main import create_app
    monkeypatch.setenv("SILA_MODE", "secure")
    monkeypatch.setenv("SILA_ENV", "production")
    monkeypatch.setenv("JWT_SECRET", "dev-only-secret-change-me-please-32chars")
    monkeypatch.setenv("MONGO_URI", "mongodb+srv://u:p@cluster.example.mongodb.net/")
    with pytest.raises(RuntimeError):
        create_app()
    monkeypatch.setenv("JWT_SECRET", "x" * 40)
    monkeypatch.setenv("CORS_ORIGINS", "*")
    with pytest.raises(RuntimeError):
        create_app()
    monkeypatch.setenv("CORS_ORIGINS", "https://sila.example")
    app = create_app()
    assert app.docs_url is None  # /docs désactivé en production


def test_production_seed_creates_no_demo_accounts(monkeypatch):
    from app import seed, db
    monkeypatch.setenv("MONGO_URI", "mongomock")
    monkeypatch.setenv("SILA_ENV", "production")
    db.reset_client()
    seed.run()
    assert db.get_db().users.count_documents({}) == 0
    assert db.get_db().categories.count_documents({}) > 0
    monkeypatch.setenv("SILA_ENV", "development")
    db.reset_client()
