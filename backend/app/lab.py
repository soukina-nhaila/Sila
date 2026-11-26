"""
⚠️  SILA SECURITY LAB — MODE VULNÉRABLE ⚠️
Ce module est VOLONTAIREMENT vulnérable. Il n'est chargé que si SILA_MODE=vulnerable,
refuse tout client hors réseau local/privé, et refuse de démarrer si SILA_ENV=production.
Données de test fictives uniquement. NE JAMAIS déployer publiquement.
"""
import base64
import ipaddress
import os
from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Depends, Cookie, Response
from fastapi.responses import HTMLResponse
from .core import get_db, ser, oid, now, check_pw

LAB_SECRET = "hardcoded-lab-secret-123"  # VULN-18 : secret codé en dur (fictif)


def local_only(request: Request):
    host = request.client.host if request.client else ""
    if host == "testclient":
        return
    try:
        ip = ipaddress.ip_address(host)
        if ip.is_loopback or ip.is_private:
            return
    except ValueError:
        pass
    raise HTTPException(403, "Lab accessible uniquement en local")


router = APIRouter(prefix="/api/lab", tags=["SECURITY-LAB (vulnerable)"], dependencies=[Depends(local_only)])


@router.get("/orders/{order_id}")  # VULN-02 IDOR/BOLA : aucun contrôle de propriété ni d'authentification
def idor_order(order_id: str):
    o = get_db().orders.find_one({"_id": oid(order_id)})
    if not o:
        raise HTTPException(404)
    return ser(o)


@router.post("/login")  # VULN-03 NoSQL injection + VULN-06 authentification faible (token prévisible) + VULN-08 pas de rate limit
def nosql_login(body: dict):
    email, pw = body.get("email"), body.get("password")
    if isinstance(pw, str):
        u = get_db().users.find_one({"email": email})
        if u and not (check_pw(pw, u["password_hash"]) or u["password_hash"] == pw):
            u = None
    else:
        # exemple d'attaque : {"email":"admin@sila.test","password":{"$ne":""}}
        u = get_db().users.find_one({"email": email, "password_hash": pw})
    if not u:
        raise HTTPException(401, "Identifiants incorrects")
    token = base64.b64encode(str(u["_id"]).encode()).decode()  # prévisible : base64(id)
    return {"token": token, "user": {k: (str(v) if k == "_id" else v) for k, v in u.items() if k != "created_at"}}


@router.get("/search", response_class=HTMLResponse)  # VULN-05 XSS réfléchi
def reflected_xss(q: str = ""):
    return f"<html><body><h1>Résultats pour : {q}</h1></body></html>"


@router.post("/reviews")  # VULN-04 XSS stocké (stockage brut)
def stored_xss_post(body: dict):
    get_db().lab_reviews.insert_one({"author": body.get("author", "anon"), "comment": body.get("comment", ""), "created_at": now()})
    return {"ok": True}


@router.get("/reviews", response_class=HTMLResponse)
def stored_xss_get():
    rows = get_db().lab_reviews.find().limit(50)
    return "<html><body>" + "".join(f"<p><b>{r['author']}</b>: {r['comment']}</p>" for r in rows) + "</body></html>"


@router.post("/register", status_code=201)  # VULN-09 mass assignment + VULN-07 politique de mot de passe faible
def mass_assignment(body: dict):
    doc = dict(body)  # tout le JSON est inséré : {"role":"ADMIN"} fonctionne
    doc["password_hash"] = doc.pop("password", "")  # mot de passe stocké en clair (fictif)
    doc.setdefault("role", "CUSTOMER")
    doc["created_at"] = now()
    doc["_id"] = get_db().users.insert_one(doc).inserted_id
    return ser(doc)


@router.get("/admin/users")  # VULN-01 Broken access control : aucune vérification de rôle + VULN-14 fuite de hashes
def broken_access_control():
    return [{**{k: (str(v) if k == "_id" else v) for k, v in u.items() if k != "created_at"}} for u in get_db().users.find()]


@router.post("/products")  # VULN-16 validation insuffisante : prix négatif accepté
def weak_validation(body: dict):
    body["created_at"] = now()
    body["_id"] = get_db().products.insert_one(body).inserted_id
    return ser(body)


@router.post("/upload")  # VULN-11 upload non sécurisé : extension/type/taille non contrôlés, nom utilisateur utilisé
async def insecure_upload(file: UploadFile = File(...)):
    os.makedirs("lab_uploads", exist_ok=True)
    path = os.path.join("lab_uploads", file.filename)  # path traversal possible
    with open(path, "wb") as f:
        f.write(await file.read())
    return {"saved_as": path}


@router.post("/session")  # VULN-10 CSRF : session par cookie, aucun jeton anti-CSRF, SameSite absent
def csrf_login(body: dict, response: Response):
    u = get_db().users.find_one({"email": body.get("email")})
    if not u:
        raise HTTPException(401)
    response.set_cookie("lab_session", str(u["_id"]))
    return {"ok": True}


@router.post("/change-email")
def csrf_change_email(body: dict, lab_session: str | None = Cookie(default=None)):
    if not lab_session:
        raise HTTPException(401)
    get_db().users.update_one({"_id": oid(lab_session)}, {"$set": {"email": body.get("email")}})
    return {"ok": True}


@router.get("/config")  # VULN-12 mauvaise configuration + VULN-14 exposition d'informations sensibles
def misconfig():
    return {"mongo_uri": os.getenv("MONGO_URI"), "jwt_secret": LAB_SECRET, "debug": True,
            "env": dict(list(os.environ.items())[:5])}
