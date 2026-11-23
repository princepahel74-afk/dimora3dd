"""A stand-in for Cloudflare's Workers AI REST API, for end-to-end tests.

    python tests/fake_cloudflare.py      # serves http://127.0.0.1:11600/client/v4
    CLOUDFLARE_API_URL=http://127.0.0.1:11600/client/v4 CLOUDFLARE_ACCOUNT_ID=0123456789abcdef0123456789abcdef \
        CLOUDFLARE_API_TOKEN=test-cloudflare python app.py

Chat:   POST /client/v4/accounts/<id>/ai/v1/chat/completions   (OpenAI format)
Images: POST /client/v4/accounts/<id>/ai/run/<model>            (multipart: prompt, width, height, input_image_0)
"""
import base64
import io
from pathlib import Path

from flask import Flask, jsonify, request

from fake_openrouter import answer  # same canned answers

PLAN_V2 = (Path(__file__).parent / "fixtures" / "test_plan_2bhk_ai.json").read_text()

app = Flask(__name__)
TOKEN = "test-cloudflare"
ACCOUNT = "0123456789abcdef0123456789abcdef"
CHAT_MODELS = {"@cf/qwen/qwen3.8-27b", "@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct", "@cf/test/strict"}
IMAGE_MODELS = {"@cf/black-forest-labs/flux-2-klein-9b", "@cf/black-forest-labs/flux-2-dev", "@cf/black-forest-labs/flux-2-klein-4b"}
SEEN = []


def cf_error(status, code, message):
    return jsonify(result=None, success=False, errors=[{"code": code, "message": message}], messages=[]), status


def auth_error(account):
    if request.headers.get("Authorization") != f"Bearer {TOKEN}":
        return cf_error(401, 10000, "Authentication error")
    if account != ACCOUNT:
        return cf_error(403, 10000, "Authentication error")
    return None


@app.post("/client/v4/accounts/<account>/ai/v1/chat/completions")
def chat(account):
    if err := auth_error(account):
        return err
    b = request.get_json()
    model = str(b.get("model", ""))
    if model not in CHAT_MODELS:
        return cf_error(400, 5007, f"AiError: No such model {model} or task")
    if "reasoning_effort" in b and model == "@cf/test/strict":  # a model that refuses an optional parameter
        return cf_error(400, 5006, "AiError: Bad input: unknown property reasoning_effort")
    msgs = b.get("messages") or []
    last = msgs[-1]["content"]
    prompt = last if isinstance(last, str) else " ".join(p.get("text", "") for p in last if p.get("type") == "text")
    images = 0 if isinstance(last, str) else sum(p.get("type") == "image_url" and p["image_url"]["url"].startswith("data:image/") for p in last)
    SEEN.append({"model": model, "images": images, "keys": sorted(b), "format": (b.get("response_format") or {}).get("type")})
    # the structured plan reading: answer with what a good reading of the 2BHK test plan looks like
    content = PLAN_V2 if "DIMORA-PLAN-V2" in prompt else answer(prompt, len(msgs))
    return jsonify(id="chatcmpl-test", object="chat.completion", model=model,
                   choices=[{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}])


@app.post("/client/v4/accounts/<account>/ai/run/<path:model>")
def run(account, model):
    """Image models: returns the reference image tinted warm and resized to width × height, as 'the photo'."""
    if err := auth_error(account):
        return err
    if model not in IMAGE_MODELS:
        return cf_error(400, 5007, f"No such model {model} or task")
    from PIL import Image, ImageEnhance
    f = request.files.get("input_image_0")
    im = Image.open(f.stream).convert("RGB") if f else None
    w, h = int(request.form.get("width", 1024)), int(request.form.get("height", 768))
    SEEN.append({"model": model, "image_in": im is not None, "ref_size": im.size if im else None, "out": (w, h),
                 "multipart": request.mimetype == "multipart/form-data", "prompt": request.form.get("prompt", "")})
    if im is not None and max(im.size) > 512:
        return cf_error(400, 5006, "AiError: input_image_0 must be smaller than 512x512")
    out = io.BytesIO()
    ImageEnhance.Color((im or Image.new("RGB", (8, 8), "gray")).resize((w, h))).enhance(1.3).save(out, "JPEG")
    return jsonify(result={"image": base64.b64encode(out.getvalue()).decode()}, success=True, errors=[], messages=[])


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=11600)
