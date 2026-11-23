"""DIMORA backend — Flask REST API + serves the web frontend.

Run:  python app.py          (then open http://127.0.0.1:8000)
"""
from __future__ import annotations

import logging
import time
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from dimora_core import pipeline
from dimora_core.ai import photo, services
from dimora_core.ai.client import AIError, AIUnavailable, client_from_request
from dimora_core.config import settings
from dimora_core.dsa.ratelimit import SlidingWindowLimiter
from dimora_core.store import AuthError, Store, StoreError
from dimora_core.planner.analysis import analyze, tour_order
from dimora_core.vision.loader import UploadError, data_url_to_image, to_jpeg_b64

FRONTEND = Path(__file__).resolve().parent.parent / "frontend"
VERSION = "3.9.0"
log = logging.getLogger("dimora")


def create_app(store: Store | None = None) -> Flask:
    app = Flask(__name__, static_folder=None)
    db = store or Store()
    auth_limit = SlidingWindowLimiter(per_hour=40, per_day=0)  # sign-in / sign-up attempts per IP
    app.config["MAX_CONTENT_LENGTH"] = settings.max_upload_mb * 1024 * 1024

    # ---------- plumbing ----------
    @app.after_request
    def cors(resp):  # the frontend may be opened from file:// or another port
        if request.path.startswith("/api/"):
            resp.headers["Cache-Control"] = "no-store"
        if app.config.get("DIMORA_SAME_ORIGIN"):
            return resp
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-AI-Provider, X-Cloudflare-Token, X-Cloudflare-Account, X-Cloudflare-Model, X-OpenRouter-Key, X-OpenRouter-Model, X-Ollama-Model, X-Ollama-Url"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        return resp

    @app.route("/api/<path:_any>", methods=["OPTIONS"])
    def preflight(_any):
        return ("", 204)

    def body():
        return request.get_json(silent=True) or {}

    def visitor():
        # Behind a host's proxy (Render, Railway, Fly…) the real client is the first X-Forwarded-For hop.
        fwd = request.headers.get("X-Forwarded-For", "")
        return (fwd.split(",")[0].strip() if fwd and settings.public else "") or request.remote_addr or "?"

    def ai_client():
        return client_from_request(request.headers, body(), visitor=visitor())

    @app.errorhandler(UploadError)
    @app.errorhandler(ValueError)
    def bad_request(e):
        return jsonify(error="bad_request", message=str(e)), 400

    @app.errorhandler(StoreError)
    def store_error(e):
        return jsonify(error="bad_request", message=str(e)), 400

    @app.errorhandler(AuthError)
    def auth_error(e):
        return jsonify(error="unauthorized", message=str(e)), 401

    @app.errorhandler(AIUnavailable)
    def no_ai(e):
        return jsonify(error="ai_unavailable", message=str(e)), 503

    @app.errorhandler(AIError)
    def ai_failed(e):
        return jsonify(error="ai_failed", message=str(e)[:400]), 502

    @app.errorhandler(413)
    def too_big(_e):
        return jsonify(error="too_large", message=f"Upload is larger than {settings.max_upload_mb} MB"), 413

    # ---------- frontend ----------
    @app.get("/")
    def index():
        resp = send_from_directory(FRONTEND, "index.html")
        resp.headers["Cache-Control"] = "no-cache"
        return resp

    @app.get("/<path:path>")
    def static_files(path):
        if path.startswith("api/"):
            return jsonify(error="not_found"), 404
        resp = send_from_directory(FRONTEND, path)
        if path.endswith(".webmanifest"):
            resp.mimetype = "application/manifest+json"
        if path.endswith(".glb"):
            resp.mimetype = "model/gltf-binary"
        if path in ("sw.js", "index.html", "manifest.webmanifest"):
            resp.headers["Cache-Control"] = "no-cache"  # the service worker and app shell must update promptly
        return resp

    # ---------- API ----------
    @app.get("/api/health")
    def health():
        return jsonify(ok=True, version=VERSION, ai=ai_client().status(), accounts=db.kind)

    # ---------- accounts ----------
    def token():
        h = request.headers.get("Authorization", "")
        return h[7:].strip() if h.lower().startswith("bearer ") else None

    def me():
        return db.user_for_token(token())

    def maybe_me():  # signed-in user, or None for guests
        try:
            return me()
        except AuthError:
            return None

    def throttle():
        if not auth_limit.check(visitor()):
            raise StoreError("Too many attempts — please wait a while and try again.")

    @app.post("/api/auth/signup")
    def signup():
        throttle()
        b = body()
        user, tok = db.signup(b.get("email"), b.get("password"), b.get("name", ""))
        return jsonify(user=user, token=tok)

    @app.post("/api/auth/login")
    def login():
        throttle()
        b = body()
        user, tok = db.login(b.get("email"), b.get("password"))
        return jsonify(user=user, token=tok)

    @app.post("/api/auth/logout")
    def logout():
        db.logout(token())
        return jsonify(ok=True)

    @app.get("/api/auth/me")
    def whoami():
        return jsonify(user=me())

    @app.patch("/api/auth/me")
    def update_me():
        b = body()
        return jsonify(user=db.update_user(me()["id"], name=b.get("name"), prefs=b.get("prefs")))

    @app.post("/api/auth/password")
    def change_password():
        throttle()
        b = body()
        return jsonify(token=db.change_password(me()["id"], b.get("old"), b.get("new")))

    @app.delete("/api/auth/me")
    def delete_me():
        u = me()
        b = body()
        db.login(u["email"], b.get("password"))  # confirm with the password before deleting
        db.delete_user(u["id"])
        return jsonify(ok=True)

    # ---------- cloud projects ----------
    @app.get("/api/projects")
    def projects():
        return jsonify(projects=db.list_projects(me()["id"]))

    @app.get("/api/projects/<pid>")
    def project_get(pid):
        return jsonify(project=db.get_project(me()["id"], pid))

    @app.put("/api/projects/<pid>")
    def project_put(pid):
        b = body()
        return jsonify(db.put_project(me()["id"], pid, b.get("project"), b.get("summary")))

    @app.delete("/api/projects/<pid>")
    def project_delete(pid):
        db.delete_project(me()["id"], pid)
        return jsonify(ok=True)

    @app.post("/api/ai/test")
    def ai_test():
        ai = ai_client()
        t0 = time.time()
        out = ai.ask_json('Reply with exactly this JSON: {"ok":"DIMORA OK"}', max_tokens=40, timeout=60)
        return jsonify(ok=out.get("ok") == "DIMORA OK", reply=out, model=ai.used, ms=round((time.time() - t0) * 1000))

    @app.post("/api/plans/detect")
    def detect():
        files = request.files.getlist("files") or request.files.getlist("file")
        if not files:
            raise UploadError("Attach at least one floor plan (PNG, JPG, WEBP or PDF) as 'files'.")
        uploads = [(f.filename or "plan.png", f.read()) for f in files]
        form = request.form
        res = pipeline.detect(
            uploads,
            width_m=float(form.get("width_m") or 0),
            forced_floors=int(form.get("floors") or 0),
            use_ai=form.get("use_ai", "1") not in ("0", "false", "off"),
            ai=ai_client(),
            default_width=float(form.get("default_width") or 12),
        )
        return jsonify(res)

    @app.post("/api/plans/restack")
    def restack():
        b = body()
        floors, offs = pipeline.restack(b["floors"], b.get("offsets") or [[0, 0]] * len(b["floors"]))
        return jsonify(floors=floors, offsets=offs)

    @app.post("/api/analyze")
    def analyze_ep():
        return jsonify(analyze(body()["project"]))

    @app.post("/api/tour")
    def tour_ep():
        return jsonify(order=tour_order(body()["project"]))

    @app.post("/api/assistant")
    def assistant():
        b, ai = body(), ai_client()
        out = services.assistant(ai, b["text"], b.get("home", "{}"), b.get("action_doc", ""), b.get("history"))
        return jsonify(**out, via=ai.used)

    @app.post("/api/narration")
    def narration():
        b, ai = body(), ai_client()
        out = services.narration(ai, b.get("theme", ""), b.get("household", ""), b.get("floors", []), b.get("rooms", []))
        return jsonify(**out, via=ai.used)

    @app.post("/api/inspiration")
    def inspiration():
        b, ai = body(), ai_client()
        img = data_url_to_image(b["image"])
        out = services.inspiration(ai, to_jpeg_b64(img, 900), b.get("styles", []), b.get("floors", []), b.get("finishes", []))
        return jsonify(**out, via=ai.used)

    # ---------- "Make it Real" photo (FLUX.2 image model on Cloudflare Workers AI), with a small daily allowance per user ----------
    @app.post("/api/ai/make-real")
    def make_real():
        b, ai = body(), ai_client()
        img = data_url_to_image(b.get("image") or "")
        own_key = bool(request.headers.get("X-Cloudflare-Token"))  # people using their own key aren't limited by the site's allowance
        user = maybe_me()
        who = f"u:{user['id']}" if user else f"v:{visitor()}"
        day = time.strftime("%Y-%m-%d", time.gmtime(time.time() + 5.5 * 3600))  # the day in India
        limit = 0 if own_key else settings.photos_per_day
        left = db.take(f"photo:{who}", day, limit)
        if left is None:
            return jsonify(error="photo_limit", message=f"You've made your {limit} free photos for today. Come back tomorrow, or add your own Cloudflare API token in Settings.",
                           limit=limit, left=0), 429
        try:
            out = photo.make_real(ai.cf_account, ai.cf_token, to_jpeg_b64(img, 1280), "image/jpeg", "exterior" if b.get("view") == "exterior" else "interior",
                                  room=str(b.get("room") or ""), style=str(b.get("style") or ""),
                                  look="showcase" if b.get("look") == "showcase" else "")
        except AIError:
            if limit:
                db.give_back(f"photo:{who}", day)
            raise
        return jsonify(image=f"data:{out['mime']};base64,{out['image']}", model=out["model"], left=left if limit else None, limit=limit or None)

    @app.get("/api/ai/make-real/quota")
    def make_real_quota():
        user = maybe_me()
        who = f"u:{user['id']}" if user else f"v:{visitor()}"
        day = time.strftime("%Y-%m-%d", time.gmtime(time.time() + 5.5 * 3600))
        lim = settings.photos_per_day
        return jsonify(limit=lim, left=max(0, lim - db.used_today(f"photo:{who}", day)))

    # ---------- "Give me 3 layout ideas" ----------
    @app.post("/api/ai/ideas")
    def ideas():
        b, ai = body(), ai_client()
        return jsonify(ideas=services.layout_ideas(ai, b.get("budget", ""), b.get("family", ""), b.get("style", ""), b.get("styles", []),
                                                   b.get("rooms", [])), via=ai.used)

    # ---------- view-only share links ----------
    @app.post("/api/share")
    def share_create():
        b = body()
        if not isinstance(b.get("project"), dict):
            raise StoreError("Nothing to share.")
        user = maybe_me()
        sid = db.put_share(b["project"], owner=user["id"] if user else "", name=str(b.get("name") or ""))
        return jsonify(id=sid, url=f"/?view={sid}")

    @app.get("/api/share/<sid>")
    def share_get(sid):
        got = db.get_share(sid)
        if not got:
            return jsonify(error="This share link doesn't exist (or has been removed)."), 404
        return jsonify(got)

    @app.post("/api/report-summary")
    def report_summary():
        b, ai = body(), ai_client()
        return jsonify(summary=services.report_summary(ai, b.get("facts", ""), b.get("room_facts", "")), via=ai.used)

    return app


app = create_app()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print(f"DIMORA backend v{VERSION} → http://{settings.host}:{settings.port}")
    st = app.test_client().get("/api/health").get_json()["ai"]
    print(f"AI: provider={st['provider']} active={st['active']} | Ollama running={st['ollama']['running']} "
          f"model {st['ollama']['model']} installed={st['ollama']['model_installed']} | Cloudflare={'yes' if st['cloudflare']['configured'] else 'no'} ({st['cloudflare']['model']}) | OpenRouter key={'yes' if st['openrouter']['configured'] else 'no'}")
    app.run(host=settings.host, port=settings.port, debug=False, threaded=True)
