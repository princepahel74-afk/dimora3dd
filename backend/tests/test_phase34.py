"""Phase 3 (Make it Real photo) and Phase 4 (layout ideas, view-only share links)."""
import base64
import io
import sys
import threading
from pathlib import Path

import pytest
from PIL import Image
from werkzeug.serving import make_server

sys.path.insert(0, str(Path(__file__).parent))
import fake_gemini  # noqa: E402
from dimora_core.ai.client import AIClient  # noqa: E402
from dimora_core.config import settings  # noqa: E402


def shot():
    b = io.BytesIO()
    Image.new("RGB", (64, 40), (180, 160, 140)).save(b, "JPEG")
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


@pytest.fixture(scope="module")
def server():
    srv = make_server("127.0.0.1", 11604, fake_gemini.app)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield "http://127.0.0.1:11604/v1beta/openai"
    srv.shutdown()


@pytest.fixture()
def gem(server, monkeypatch):
    monkeypatch.setattr(settings, "gemini_url", server)
    monkeypatch.setattr(settings, "gemini_key", "test-gemini")
    monkeypatch.setattr(settings, "photos_per_day", 2)
    monkeypatch.setattr(AIClient, "ollama_models", lambda self: None)
    fake_gemini.SEEN.clear()
    return fake_gemini.SEEN


def test_make_real_returns_a_photo_and_counts_the_allowance(client, gem):
    r = client.post("/api/ai/make-real", json={"image": shot(), "view": "interior"})
    j = r.get_json()
    assert r.status_code == 200 and j["image"].startswith("data:image/png;base64,") and j["left"] == 1 and j["limit"] == 2
    assert gem[-1]["model"] == settings.gemini_image_model and gem[-1]["image_in"] and gem[-1]["modalities"] == ["IMAGE"]
    Image.open(io.BytesIO(base64.b64decode(j["image"].split(",", 1)[1])))  # a real image came back
    assert client.post("/api/ai/make-real", json={"image": shot()}).status_code == 200
    r = client.post("/api/ai/make-real", json={"image": shot()})
    assert r.status_code == 429 and "2 free photos" in r.get_json()["message"]
    assert client.get("/api/ai/make-real/quota").get_json() == {"limit": 2, "left": 0}
    # with their own key, people aren't limited
    r = client.post("/api/ai/make-real", json={"image": shot()}, headers={"X-Gemini-Key": "test-gemini"})
    assert r.status_code == 200 and r.get_json()["left"] is None


def test_make_real_falls_back_to_another_image_model(client, gem, monkeypatch):
    monkeypatch.setattr(settings, "gemini_image_model", "gemini-old-flash")  # not an image model on the fake server → 404
    r = client.post("/api/ai/make-real", json={"image": shot()})
    assert r.status_code == 200 and r.get_json()["model"] == "gemini-3.1-flash-image"


def test_make_real_failure_does_not_use_the_allowance(client, gem, monkeypatch):
    monkeypatch.setattr(settings, "gemini_key", "wrong")
    r = client.post("/api/ai/make-real", json={"image": shot()})
    assert r.status_code == 502 and "rejected" in r.get_json()["message"]
    assert client.get("/api/ai/make-real/quota").get_json()["left"] == 2


def test_make_real_rejects_bad_images(client, gem):
    assert client.post("/api/ai/make-real", json={"image": "data:image/png;base64,AAAA"}).status_code == 400


def test_share_link_round_trip(client):
    p = {"name": "Test 2BHK", "floors": [{"rooms": [{"name": "Living", "w": 5}]}]}
    r = client.post("/api/share", json={"project": p, "name": "Test 2BHK"}).get_json()
    assert r["url"] == f"/?view={r['id']}"
    got = client.get(f"/api/share/{r['id']}").get_json()
    assert got["project"] == p and got["name"] == "Test 2BHK"
    assert client.get("/api/share/nope").status_code == 404
    assert client.post("/api/share", json={}).status_code == 400


def test_showcase_photos_use_the_brochure_prompt(client, gem):
    r = client.post("/api/ai/make-real", json={"image": shot(), "view": "exterior", "room": "front of the house", "style": "modern interior", "look": "showcase"})
    assert r.status_code == 200
    p = gem[-1]["prompt"]
    assert "luxury real-estate listing photograph" in p and "dusk twilight" in p and "modern interior style" in p
    client.post("/api/ai/make-real", json={"image": shot(), "view": "interior"})
    assert "luxury" not in gem[-1]["prompt"] and "KEEP EXACTLY" in gem[-1]["prompt"]  # the normal Make it Real stays faithful
