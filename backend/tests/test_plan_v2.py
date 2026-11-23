"""Phase 1: Gemini reads the 2BHK test plan in the structured v2 format and DIMORA builds it exactly."""
import json
import sys
import threading
from pathlib import Path

import pytest
from werkzeug.serving import make_server

sys.path.insert(0, str(Path(__file__).parent))
import fake_gemini  # noqa: E402
from dimora_core import pipeline  # noqa: E402
from dimora_core.ai import plan_schema  # noqa: E402
from dimora_core.ai.client import AIClient  # noqa: E402
from dimora_core.config import settings  # noqa: E402

PLAN = Path(__file__).resolve().parent.parent.parent / "samples" / "dimora_test_plan_2bhk.png"
FT = 0.3048


@pytest.fixture(scope="module")
def server():
    srv = make_server("127.0.0.1", 11603, fake_gemini.app)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield "http://127.0.0.1:11603/v1beta/openai"
    srv.shutdown()


@pytest.fixture()
def ai(server, monkeypatch):
    monkeypatch.setattr(settings, "gemini_url", server)
    monkeypatch.setattr(settings, "gemini_key", "test-gemini")
    monkeypatch.setattr(settings, "gemini_model", "gemini-3.8-flash")
    monkeypatch.setattr(AIClient, "ollama_models", lambda self: None)
    fake_gemini.SEEN.clear()
    return AIClient(provider="gemini")


def ft(r):
    return round(r["w"] / FT, 1), round(r["d"] / FT, 1)


def test_validate_fills_defaults_and_drops_junk():
    plan, warn = plan_schema.validate({"house": {"width_ft": 30, "depth_ft": 40}, "rooms": [
        {"name": "Hall", "type": "living", "x": 0, "y": 0, "w": 30, "d": 20}, {"name": "Bed", "type": "BEDROOM", "x": 0, "y": 20, "w": 30, "d": 20},
        {"name": "junk", "type": "x", "x": "a", "y": 0, "w": 1, "d": 1}], "doors": [{"x": 5, "y": 40, "kind": "weird"}], "windows": []})
    assert [r["type"] for r in plan["rooms"]] == ["living", "bedroom"]
    assert plan["ceiling_ft"] == 10 and plan["walls"] == {"outer_in": 9, "inner_in": 4.5}
    assert plan["doors"][0]["kind"] == "hinged" and plan["doors"][0]["width_ft"] == 3.0
    assert any("ceiling" in w for w in warn) and any("main door" in w for w in warn)
    assert plan_schema.usable(plan)


def test_structured_reading_of_the_test_plan(ai):
    res = pipeline.detect([(PLAN.name, PLAN.read_bytes())], ai=ai)
    assert res["source"] == "Gemini (structured)"
    assert fake_gemini.SEEN[0]["format"] == "json_schema" and fake_gemini.SEEN[0]["images"] == 1
    f = res["floors"][0]
    by = {r["name"]: r for r in f["rooms"]}
    want = {"Living Room": (18, 16), "Dining": (18, 12), "Kitchen": (12, 10), "Bedroom 1": (18, 12), "Bedroom 2": (18, 12),
            "Passage": (6, 28), "Bathroom": (12, 6), "Toilet 2": (12, 6), "Store / Utility": (12, 6), "Balcony": (18, 4.5),
            "Porch / Sit-out": (14, 4), "Parking": (19, 17), "Front Garden": (21, 13)}
    for name, (w, d) in want.items():
        assert name in by, name
        assert abs(ft(by[name])[0] - w) < 0.15 and abs(ft(by[name])[1] - d) < 0.15, (name, ft(by[name]))
    assert by["Toilet 2"]["type"] == "bathroom" and by["Store / Utility"]["type"] == "store" and by["Passage"]["type"] == "hall"
    assert by["Porch / Sit-out"]["type"] == "porch" and by["Porch / Sit-out"]["steps"] == 3
    assert by["Parking"]["cars"] == 1 and len(by["Front Garden"]["trees"]) == 3 and len(by["Back Garden"]["trees"]) == 1
    assert by["Balcony"]["y"] < 0 and by["Balcony"]["x"] == by["Bedroom 2"]["x"]  # behind Bedroom 2
    # one open area: living + dining + passage
    assert by["Living Room"]["group"] == by["Dining"]["group"] == by["Passage"]["group"]
    # house 36 x 40 ft, 1440 sq ft built-up
    assert res["built_up_sqft"] == 1440
    inside = [r for r in f["rooms"] if r["type"] not in ("balcony", "porch", "parking", "garden")]
    assert round((max(r["x"] + r["w"] for r in inside) - min(r["x"] for r in inside)) / FT) == 36
    assert round((max(r["y"] + r["d"] for r in inside) - min(r["y"] for r in inside)) / FT) == 40
    # doors: main door on the porch side, a sliding door to the balcony, defaults for heights
    main = [d for d in f["doors"] if d.get("main")]
    assert len(main) == 1 and abs(main[0]["y"] - 40 * FT) < 0.01
    sl = [d for d in f["doors"] if d.get("sliding")]
    assert len(sl) == 1 and abs(sl[0]["y"]) < 0.01 and abs(sl[0]["w"] - 6 * FT) < 0.01
    assert len(f["windows"]) == 11 and all(w["sill"] in (round(3 * FT, 2), 1.5) for w in f["windows"])
    assert abs(f["height"] - (10 * FT + 0.15)) < 0.02
    assert res["wall_thickness"] == {"ext": 0.23, "int": 0.11}
    assert res["north"] == 0 and res["site"]["road"] == "S" and res["site"]["gate"]
    assert f["overlay"]["image"].startswith("data:image")


def test_detect_endpoint_falls_back_without_ai(client):
    r = client.post("/api/plans/detect", data={"files": (PLAN.open("rb"), PLAN.name), "use_ai": "0"}, content_type="multipart/form-data")
    assert r.status_code == 200 and r.get_json()["source"] == "Computer vision"
