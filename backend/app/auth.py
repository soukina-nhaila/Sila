import re
import time
import secrets
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, field_validator
from .core import (get_db, hash_pw, check_pw, make_token, ser, now, current_user)

router = APIRouter(prefix="/api/auth", tags=["auth"])
ALLOWED_ROLES = {"CUSTOMER", "SELLER", "RESTAURANT_OWNER", "COURIER"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_attempts = defaultdict(list)


def reset_limiter():
    _attempts.clear()


class RegisterIn(BaseModel):
    email: str
    password: str
    name: str
    role: str = "CUSTOMER"
    store_name: str | None = None

    @field_validator("email")
    @classmethod
    def v_email(cls, v):
        v = v.strip().lower()
        if not EMAIL_RE.match(v) or len(v) > 120:
            raise ValueError("Email invalide")
        return v

    @field_validator("password")
    @classmethod
    def v_pw(cls, v):
        if len(v) < 8 or not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("Mot de passe : 8 caractères minimum, lettres et chiffres")
        return v

    @field_validator("name")
    @classmethod
    def v_name(cls, v):
        v = v.strip()
        if not 2 <= len(v) <= 80:
            raise ValueError("Nom invalide")
        return v


class LoginIn(BaseModel):
    email: str
    password: str


class AddressIn(BaseModel):
    label: str = "Maison"
    line: str
    city: str
    postal_code: str
    country: str = "MA"


@router.post("/register", status_code=201)
def register(body: RegisterIn):
    if body.role not in ALLOWED_ROLES:
        raise HTTPException(400, "Rôle non autorisé à l'inscription")
    db = get_db()
    if db.users.find_one({"email": body.email}):
        raise HTTPException(409, "Email déjà utilisé")
    user = {"email": body.email, "password_hash": hash_pw(body.password), "name": body.name,
            "role": body.role, "suspended": False, "created_at": now()}
    uid = db.users.insert_one(user).inserted_id
    if body.role == "SELLER":
        db.sellers.insert_one({"user_id": uid, "store_name": body.store_name or body.name + " Store",
                               "created_at": now()})
    if body.role == "COURIER":
        db.couriers.insert_one({"user_id": uid, "available": True, "created_at": now()})
    user["_id"] = uid
    return {"token": make_token(user), "user": ser(user)}


@router.post("/login")
def login(body: LoginIn, request: Request):
    key = f"{request.client.host if request.client else 'x'}:{body.email.lower()}"
    t = time.time()
    _attempts[key] = [x for x in _attempts[key] if t - x < 60]
    if len(_attempts[key]) >= 10:
        raise HTTPException(429, "Trop de tentatives, réessayez dans une minute")
    u = get_db().users.find_one({"email": body.email.strip().lower()})
    if not u or not check_pw(body.password, u["password_hash"]):
        _attempts[key].append(t)
        raise HTTPException(401, "Identifiants incorrects")
    if u.get("suspended"):
        raise HTTPException(403, "Compte suspendu")
    return {"token": make_token(u), "user": ser(u)}


@router.get("/me")
def me(u=Depends(current_user)):
    return ser(u)


@router.put("/me")
def update_me(body: dict, u=Depends(current_user)):
    name = str(body.get("name", u["name"])).strip()[:80]
    get_db().users.update_one({"_id": u["_id"]}, {"$set": {"name": name}})
    return {"name": name}


@router.get("/addresses")
def list_addresses(u=Depends(current_user)):
    return ser(list(get_db().addresses.find({"user_id": u["_id"]})))


@router.post("/addresses", status_code=201)
def add_address(body: AddressIn, u=Depends(current_user)):
    doc = body.model_dump() | {"user_id": u["_id"], "created_at": now()}
    doc["_id"] = get_db().addresses.insert_one(doc).inserted_id
    return ser(doc)


@router.post("/forgot")
def forgot(body: dict):
    """Démonstration : en vrai, le token serait envoyé par email."""
    email = str(body.get("email", "")).lower()
    db = get_db()
    u = db.users.find_one({"email": email})
    out = {"message": "Si le compte existe, un lien a été envoyé (démo)."}
    if u:
        tok = secrets.token_urlsafe(24)
        db.users.update_one({"_id": u["_id"]}, {"$set": {"reset_token": tok}})
        out["demo_token"] = tok
    return out


@router.post("/reset")
def reset(body: dict):
    tok, pw = str(body.get("token", "")), str(body.get("password", ""))
    if len(pw) < 8 or not re.search(r"\d", pw) or not re.search(r"[A-Za-z]", pw):
        raise HTTPException(422, "Mot de passe trop faible")
    db = get_db()
    u = db.users.find_one({"reset_token": tok}) if tok else None
    if not u:
        raise HTTPException(400, "Token invalide")
    db.users.update_one({"_id": u["_id"]}, {"$set": {"password_hash": hash_pw(pw)}, "$unset": {"reset_token": ""}})
    return {"message": "Mot de passe modifié"}
