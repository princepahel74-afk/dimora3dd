"""WSGI entry point for an owner-only DIMORA deployment."""
from hashlib import sha256
from hmac import compare_digest
from os import environ

from flask import Response, g, request
from itsdangerous import BadSignature, URLSafeTimedSerializer

from app import FRONTEND, app


password = environ.get("DIMORA_OWNER_PASSWORD", "")
if len(password) < 24:
    raise RuntimeError("Set DIMORA_OWNER_PASSWORD to a random password of at least 24 characters.")

app.config["DIMORA_SAME_ORIGIN"] = True
password_digest = sha256(password.encode()).digest()
sessions = URLSafeTimedSerializer(password, salt="dimora-render-owner-v1")
cookie_name = "__Host-dimora_owner"
session_age = 8 * 60 * 60
index = (FRONTEND / "index.html").read_text(encoding="utf-8").replace(
    '<meta charset="utf-8">',
    '<meta charset="utf-8">\n<meta name="dimora-hosting" content="private">\n'
    '<meta name="dimora-api" content="same-origin">',
    1,
)


@app.get("/healthz")
def render_health():
    return {"ok": True}


@app.before_request
def restrict_to_owner():
    if request.endpoint == "render_health":
        return None
    origin = request.headers.get("Origin")
    if request.method not in ("GET", "HEAD", "OPTIONS") and origin and origin != f"https://{request.host}":
        return {"error": "forbidden"}, 403

    auth = request.authorization
    if auth and auth.type == "basic" and auth.username == "owner" and compare_digest(
        sha256((auth.password or "").encode()).digest(), password_digest
    ):
        g.issue_owner_cookie = True
    else:
        try:
            owner = sessions.loads(request.cookies.get(cookie_name, ""), max_age=session_age)
        except BadSignature:
            owner = None
        if owner != "owner":
            return Response(
                "DIMORA owner sign-in required.",
                401,
                {"WWW-Authenticate": 'Basic realm="DIMORA owner", charset="UTF-8"'},
            )

    if request.path in ("/", "/index.html"):
        return Response(index, mimetype="text/html")
    return None


@app.after_request
def prevent_shared_caching(response):
    response.headers["Cache-Control"] = "private, no-store"
    if getattr(g, "issue_owner_cookie", False):
        response.set_cookie(
            cookie_name, sessions.dumps("owner"), max_age=session_age,
            secure=True, httponly=True, samesite="Lax",
        )
    return response
