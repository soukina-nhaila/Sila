import os
import sys
import importlib
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
os.environ["MONGO_URI"] = "mongomock"
os.environ["JWT_SECRET"] = "test-secret-test-secret-test-secret-32"


def build(mode="secure"):
    os.environ["SILA_MODE"] = mode
    from app import db, auth, seed
    from app import main
    db.reset_client()
    auth.reset_limiter()
    importlib.reload(main)
    seed.run()
    from fastapi.testclient import TestClient
    return TestClient(main.create_app())


@pytest.fixture()
def client():
    return build("secure")


@pytest.fixture()
def lab_client():
    c = build("vulnerable")
    yield c
    os.environ["SILA_MODE"] = "secure"


def login(c, email, pw="Sila@2026"):
    r = c.post("/api/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200, r.text
    return {"Authorization": "Bearer " + r.json()["token"]}
