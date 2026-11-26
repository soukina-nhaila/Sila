import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import auth, shop, food, orders, admin
from .db import ensure_indexes


def create_app() -> FastAPI:
    mode = os.getenv("SILA_MODE", "secure").lower()
    if mode == "vulnerable" and os.getenv("SILA_ENV", "development").lower() == "production":
        raise RuntimeError("Le mode vulnérable est interdit en production.")

    @asynccontextmanager
    async def lifespan(_app):
        ensure_indexes()
        yield

    app = FastAPI(title="SILA API", version="1.0.0", lifespan=lifespan,
                  description=f"Mode actuel : {mode.upper()}")

    if mode == "vulnerable":  # VULN-15 : CORS trop permissif
        app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
    else:
        origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
        app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                           allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"], allow_headers=["Authorization", "Content-Type"])

        @app.middleware("http")
        async def security_headers(request, call_next):
            resp = await call_next(request)
            resp.headers["X-Content-Type-Options"] = "nosniff"
            resp.headers["X-Frame-Options"] = "DENY"
            resp.headers["Referrer-Policy"] = "no-referrer"
            resp.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'" if not request.url.path.startswith(("/docs", "/redoc", "/openapi")) else "default-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net data:"
            return resp

    for r in (auth.router, shop.router, food.router, orders.router, admin.router):
        app.include_router(r)
    if mode == "vulnerable":
        from . import lab
        app.include_router(lab.router)

    @app.get("/api/health", tags=["monitoring"])
    def health():
        from .db import get_db
        get_db().command("ping") if os.getenv("MONGO_URI") != "mongomock" else None
        return {"status": "ok", "mode": mode}

    return app


app = create_app()
