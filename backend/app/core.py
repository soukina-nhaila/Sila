import os
import datetime as dt
from bson import ObjectId
from bson.errors import InvalidId
import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .db import get_db

ALGO = "HS256"
bearer = HTTPBearer(auto_error=False)


def secret() -> str:
    return os.getenv("JWT_SECRET", "dev-only-secret-change-me-please-32chars")


def now():
    return dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)


def hash_pw(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt(rounds=10)).decode()


def check_pw(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except ValueError:
        return False


def make_token(user) -> str:
    payload = {"sub": str(user["_id"]), "role": user["role"],
               "exp": dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=8)}
    return jwt.encode(payload, secret(), ALGO)


def ser(o):
    if isinstance(o, ObjectId):
        return str(o)
    if isinstance(o, (dt.datetime, dt.date)):
        return o.isoformat()
    if isinstance(o, list):
        return [ser(i) for i in o]
    if isinstance(o, dict):
        out = {}
        for k, v in o.items():
            if k == "password_hash":
                continue
            out["id" if k == "_id" else k] = ser(v)
        return out
    return o


def oid(s: str) -> ObjectId:
    try:
        return ObjectId(s)
    except (InvalidId, TypeError):
        raise HTTPException(400, "Identifiant invalide")


def current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds:
        raise HTTPException(401, "Authentification requise")
    try:
        data = jwt.decode(creds.credentials, secret(), algorithms=[ALGO])
    except jwt.PyJWTError:
        raise HTTPException(401, "Token invalide ou expiré")
    u = get_db().users.find_one({"_id": oid(data["sub"])})
    if not u or u.get("suspended"):
        raise HTTPException(403, "Compte inactif ou suspendu")
    return u


def require(*roles):
    def dep(u=Depends(current_user)):
        if u["role"] not in roles:
            raise HTTPException(403, "Accès refusé pour ce rôle")
        return u
    return dep


def notify(user_id, title, body=""):
    get_db().notifications.insert_one(
        {"user_id": user_id, "title": title, "body": body, "read": False, "created_at": now()})
