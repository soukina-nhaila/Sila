"""Crée (ou promeut) un administrateur.
Usage : ADMIN_EMAIL=moi@exemple.com ADMIN_PASSWORD='MotDePasseLong!2026' python -m app.create_admin
(sans variables, le mot de passe est demandé au clavier)"""
import os
import re
import sys
import getpass
from .db import get_db, ensure_indexes
from .core import hash_pw, now


def main():
    email = (os.getenv("ADMIN_EMAIL") or input("Email admin : ")).strip().lower()
    pw = os.getenv("ADMIN_PASSWORD") or getpass.getpass("Mot de passe (12+ caractères) : ")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        sys.exit("Email invalide")
    if len(pw) < 12 or not re.search(r"[A-Za-z]", pw) or not re.search(r"\d", pw):
        sys.exit("Mot de passe trop faible : 12 caractères minimum, lettres et chiffres")
    ensure_indexes()
    db = get_db()
    db.users.update_one({"email": email}, {"$set": {"password_hash": hash_pw(pw), "role": "ADMIN", "suspended": False},
                                           "$setOnInsert": {"name": "Administrateur", "created_at": now()}}, upsert=True)
    print("Administrateur prêt :", email)


if __name__ == "__main__":
    main()
