"""A stand-in for Google's Gemini OpenAI-compatible endpoint, for end-to-end tests.

    python tests/fake_gemini.py      # serves http://127.0.0.1:11600/v1beta/openai
    GEMINI_URL=http://127.0.0.1:11600/v1beta/openai GEMINI_API_KEY=test-gemini python app.py
"""
import base64
import io
import json
from pathlib import Path

from flask import Flask, jsonify, request

from fake_openrouter import answer  # same canned answers

PLAN_V2 = (Path(__file__).parent / "fixtures" / "test_plan_2bhk_gemini.json").read_text()

app = Flask(__name__)
KEY = "test-gemini"
SEEN = []


@app.post("/v1beta/openai/chat/completions")
def chat():
    if request.headers.get("Authorization") != f"Bearer {KEY}":
        return jsonify([{"error": {"code": 401, "message": "API key not valid. Please pass a valid API key.", "status": "INVALID_ARGUMENT"}}]), 401
    b = request.get_json()
    if not str(b.get("model", "")).startswith("gemini-"):
        return jsonify([{"error": {"code": 404, "message": f"models/{b.get('model')} is not found", "status": "NOT_FOUND"}}]), 404
    if "temperature" in b and b.get("model") == "gemini-strict":  # a model that refuses temperature, like some Gemini 3 models
        return jsonify([{"error": {"code": 400, "message": "temperature is not supported", "status": "INVALID_ARGUMENT"}}]), 400
    msgs = b.get("messages") or []
    last = msgs[-1]["content"]
    prompt = last if isinstance(last, str) else " ".join(p.get("text", "") for p in last if p.get("type") == "text")
    images = 0 if isinstance(last, str) else sum(p.get("type") == "image_url" for p in last)
    SEEN.append({"model": b.get("model"), "images": images, "keys": sorted(b), "format": (b.get("response_format") or {}).get("type")})
    # the structured plan reading: answer with what a good reading of the 2BHK test plan looks like
    content = PLAN_V2 if "DIMORA-PLAN-V2" in prompt else answer(prompt, len(msgs))
    return jsonify(choices=[{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}], model=b.get("model"))


@app.post("/v1beta/models/<model>:generateContent")
def generate_content(model):
    """Native Gemini endpoint (image models): returns the input image tinted warm, as 'the photo'."""
    if request.headers.get("x-goog-api-key") != KEY:
        return jsonify({"error": {"code": 401, "message": "API key not valid.", "status": "UNAUTHENTICATED"}}), 401
    if "image" not in model:
        return jsonify({"error": {"code": 404, "message": f"models/{model} is not found", "status": "NOT_FOUND"}}), 404
    b = request.get_json()
    parts = b["contents"][0]["parts"]
    img = next((p.get("inline_data") or p.get("inlineData") for p in parts if p.get("inline_data") or p.get("inlineData")), None)
    SEEN.append({"model": model, "image_in": bool(img), "modalities": (b.get("generationConfig") or {}).get("responseModalities"),
                 "prompt": " ".join(p.get("text", "") for p in parts if p.get("text"))})
    from PIL import Image, ImageEnhance
    im = Image.open(io.BytesIO(base64.b64decode(img["data"]))).convert("RGB")
    im = ImageEnhance.Color(im).enhance(1.3)
    out = io.BytesIO()
    im.save(out, "PNG")
    return jsonify(candidates=[{"content": {"parts": [{"text": "Here is the photo."}, {"inlineData": {"mimeType": "image/png", "data": base64.b64encode(out.getvalue()).decode()}}]}}])


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=11600)
