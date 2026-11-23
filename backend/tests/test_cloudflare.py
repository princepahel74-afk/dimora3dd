"""Cloudflare Workers AI as DIMORA's AI, against a local stand-in for the Cloudflare API."""
import json
import sys
import threading
from pathlib import Path

import pytest
from werkzeug.serving import make_server

sys.path.insert(0, str(Path(__file__).parent))
import fake_cloudflare  # noqa: E402
from dimora_core.ai.client import AIClient, AIError  # noqa: E402
from dimora_core.config import settings  # noqa: E402


@pytest.fixture(scope="module")
def cf_server():
    srv = make_server("127.0.0.1", 11601, fake_cloudflare.app)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    yield "http://127.0.0.1:11601/client/v4"
    srv.shutdown()


@pytest.fixture()
def cf(cf_server, monkeypatch):
    monkeypatch.setattr(settings, "cloudflare_url", cf_server)
    monkeypatch.setattr(settings, "cloudflare_account", fake_cloudflare.ACCOUNT)
    monkeypatch.setattr(settings, "cloudflare_token", "test-cloudflare")
    monkeypatch.setattr(settings, "cloudflare_model", "@cf/qwen/qwen3.8-27b")
    monkeypatch.setattr(AIClient, "ollama_models", lambda self: None)  # no local Ollama
    fake_cloudflare.SEEN.clear()
    return fake_cloudflare.SEEN


def test_cloudflare_is_first_choice_and_answers(cf):
    ai = AIClient(provider="auto")
    assert ai.order()[0] == "cloudflare"
    assert ai.label() == "Cloudflare Workers AI · qwen3.8-27b"
    assert ai.ask_json("say ok") == {"ok": "DIMORA OK"}
    assert ai.used == "cloudflare:@cf/qwen/qwen3.8-27b"
    assert "response_format" in cf[-1]["keys"] and "reasoning_effort" in cf[-1]["keys"]


def test_old_gemini_setting_now_means_cloudflare(cf):
    assert AIClient(provider="gemini").order() == ["cloudflare"]


def test_cloudflare_reads_images_as_data_urls(cf):
    ai = AIClient(provider="cloudflare")
    ai.chat([{"role": "user", "text": "say ok", "images": ["aGVsbG8="]}])
    assert cf[-1]["images"] == 1


def test_cloudflare_retries_without_unsupported_params(cf):
    ai = AIClient(provider="cloudflare", cloudflare_model="@cf/test/strict")
    assert ai.ask_json("say ok") == {"ok": "DIMORA OK"}
    assert "reasoning_effort" not in cf[-1]["keys"] and "response_format" in cf[-1]["keys"]


def test_a_retired_model_falls_back_to_a_current_one(cf):
    ai = AIClient(provider="cloudflare", cloudflare_model="@cf/old/retired-model")
    assert ai.ask_json("say ok") == {"ok": "DIMORA OK"}
    assert ai.used == "cloudflare:@cf/qwen/qwen3.8-27b"
    assert [s["model"] for s in cf] == ["@cf/qwen/qwen3.8-27b"]


def test_cloudflare_bad_token_and_account_give_clear_errors(cf):
    with pytest.raises(AIError, match="Cloudflare API token was rejected"):
        AIClient(provider="cloudflare", cloudflare_token="wrong").chat([{"role": "user", "text": "hi"}])
    with pytest.raises(AIError, match="account ID looks wrong"):
        AIClient(provider="cloudflare", cloudflare_account="../../evil").chat([{"role": "user", "text": "hi"}])
    with pytest.raises(AIError, match="Workers AI permission"):
        AIClient(provider="cloudflare", cloudflare_account="f" * 32).chat([{"role": "user", "text": "hi"}])
    assert not cf  # nothing reached the model


def test_cloudflare_needs_both_account_and_token(cf, monkeypatch, client):
    monkeypatch.setattr(settings, "cloudflare_account", "")
    assert AIClient(provider="auto").order() == []
    assert AIClient(provider="cloudflare").order() == []  # forced but not set up: "not connected", not a broken AI
    monkeypatch.setattr(settings, "ai_provider", "cloudflare")
    assert client.get("/api/health").get_json()["ai"]["active"] is None
    r = client.post("/api/ai/ideas", json={"rooms": []})
    assert r.status_code == 503 and r.get_json()["error"] == "ai_unavailable"


def test_assistant_endpoint_runs_on_cloudflare(cf, client):
    home = json.dumps({"rooms": [{"id": "r1", "name": "Bedroom", "type": "bedroom"}], "totals": {"estimate_inr": 100000}})
    doc = '{"do":"wall_color","room":"..","color":"#hex","name":".."}'
    r = client.post("/api/assistant", json={"text": "paint the bedroom sage", "home": home, "action_doc": doc})
    assert r.status_code == 200, r.get_json()
    j = r.get_json()
    assert j["actions"] == [{"do": "wall_color", "room": "r1", "color": "#b5c4a8", "name": "sage"}]
    assert cf and cf[-1]["model"] == "@cf/qwen/qwen3.8-27b"


def test_visitor_headers_choose_the_model(cf, client):
    home = json.dumps({"rooms": [{"id": "r1", "name": "Bedroom", "type": "bedroom"}], "totals": {"estimate_inr": 100000}})
    r = client.post("/api/assistant", json={"text": "how much", "home": home, "action_doc": ""},
                    headers={"X-Cloudflare-Model": "@cf/meta/llama-4-scout-17b-16e-instruct"})
    assert r.status_code == 200 and cf[-1]["model"] == "@cf/meta/llama-4-scout-17b-16e-instruct"


def test_health_reports_cloudflare(cf, client):
    j = client.get("/api/health").get_json()
    assert j["ai"]["cloudflare"]["configured"] is True and j["ai"]["cloudflare"]["model"] == "@cf/qwen/qwen3.8-27b"
    assert j["ai"]["active"] == "cloudflare"
    assert "X-Cloudflare-Token" in client.get("/api/health").headers["Access-Control-Allow-Headers"]
