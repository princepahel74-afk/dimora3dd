"""'Make it Real': a FLUX.2 image model on Cloudflare Workers AI turns a screenshot of the 3D view into a photorealistic photo.

Uses the Workers AI REST API (POST /accounts/<id>/ai/run/<model>) with multipart form data: the prompt plus the 3D view
as reference image input_image_0. Workers AI takes reference images up to 512 × 512, so the view is shrunk for the
reference while the photo itself comes back at full size, in the same shape as the view. The prompt asks the model to
keep the layout: same camera, walls, doors, windows and furniture — only materials, light and detail become photographic.
"""
from __future__ import annotations

import base64
import io
import re

import requests
from PIL import Image

from ..config import settings
from .client import AIError, cf_account_url, cf_error_message, cf_model_missing

# tried in order when a model is not available to the account (Workers AI adds and retires image models over time)
FALLBACK_MODELS = ["@cf/black-forest-labs/flux-2-klein-9b", "@cf/black-forest-labs/flux-2-dev", "@cf/black-forest-labs/flux-2-klein-4b"]
REF_MAX = 512     # Workers AI's limit for each reference image (pixels per side)
OUT_LONG = 1280   # long side of the photo that comes back
OUT_MAX = 1920    # FLUX.2 [klein] accepts 256–1920 px per side

PROMPT = """Turn this 3D render of a home (input image 0) into a photorealistic {kind} photograph, like a professional real-estate photo.
KEEP EXACTLY: the same camera angle and framing, every wall, door, window and opening in the same place, the same rooms,
the same furniture in the same positions and sizes, and the same colours and materials (just make them real).
IMPROVE: realistic textures (wood grain, stone, fabric, paint), soft natural daylight with real shadows and bounce light,
reflections on glass and polished floors, small lived-in details that don't change the layout.
Do NOT add or remove furniture, rooms, windows or doors. Do NOT change the architecture. No people, no text, no watermark."""

# the Property Showcase wants brochure photos: same home, but styled and lit like a high-end listing shoot
SHOWCASE_PROMPT = """Turn this simple 3D render of a home (input image 0) into a luxury real-estate listing photograph, as if shot by a top
architectural photographer for a premium property brochure. It must look like a real photo, not a render.
KEEP: the camera angle and framing, the architecture (walls, room shape, ceiling, every window, door and opening in the same
place), and each main piece of furniture in the same position and of the same kind.
MAKE IT REAL AND BEAUTIFUL: replace the simple blocky furniture with real, well-made designer furniture of the same type and size;
real materials (polished marble or wood floors, natural stone, textured fabrics, matte plaster walls, brushed metal);
tasteful styling (a rug, cushions and throws, framed art, indoor plants, sheer curtains, books, a vase); real light fittings
(pendants, cove lighting, warm lamps switched on).
LIGHT: {light}. Wide-angle 24mm lens, eye level, vertical lines perfectly straight, high dynamic range, crisp detail,
natural colour, gentle depth.
Do NOT add rooms, windows or doors and do NOT move walls. No people, no text, no logos, no watermark."""
SHOWCASE_LIGHT = {
    "interior": "soft natural daylight through the windows with real shadows and bounce light, plus warm accent lights",
    "exterior": "dusk twilight: deep blue sky with a warm glow on the horizon, warm light glowing from every window, "
                "landscape lights on, lush planting and a clean driveway",
}


def _clean(t: str) -> str:
    return re.sub(r"[^\w &/'.,()-]+", " ", str(t or ""))[:60].strip()


def _sizes(image_b64: str) -> tuple[bytes, int, int]:
    """The reference image (JPEG, within 512 × 512) and the output size: the view's shape, long side 1280, multiples of 16."""
    try:
        im = Image.open(io.BytesIO(base64.b64decode(image_b64))).convert("RGB")
    except Exception as e:  # noqa: BLE001 — any undecodable picture is the caller's mistake
        raise AIError("Could not read the 3D view picture", status=400) from e
    w, h = im.size
    k = OUT_LONG / max(w, h)
    ow, oh = (max(256, min(OUT_MAX, round(v * k / 16) * 16)) for v in (w, h))
    im.thumbnail((REF_MAX, REF_MAX), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=92)
    return buf.getvalue(), ow, oh


def _mime(b64: str) -> str:
    return {"iVBOR": "image/png", "/9j/": "image/jpeg", "UklGR": "image/webp"}.get(
        next((p for p in ("iVBOR", "/9j/", "UklGR") if b64.startswith(p)), ""), "image/png")


def _image_from(r) -> str | None:
    """Workers AI answers {"result": {"image": "<base64>"}, "success": true}; some image models send raw image bytes."""
    if (r.headers.get("Content-Type") or "").startswith("image/"):
        return base64.b64encode(r.content).decode()
    try:
        j = r.json()
    except ValueError:
        return None
    res = j.get("result") if isinstance(j.get("result"), dict) else j
    img = res.get("image")
    if isinstance(img, str) and img.startswith("data:"):
        img = img.split(",", 1)[1]
    return img or None


def make_real(account: str, token: str, image_b64: str, mime: str = "image/jpeg", kind: str = "interior", timeout: float = 120,
              room: str = "", style: str = "", look: str = "") -> dict:
    if not (account and token):
        raise AIError("No Cloudflare Workers AI: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN on the server "
                      "(or add your own in Settings).")
    base = cf_account_url(account) + "/ai/run/"
    models = [settings.cloudflare_image_model] + [m for m in FALLBACK_MODELS if m != settings.cloudflare_image_model]
    if look == "showcase":
        text = SHOWCASE_PROMPT.format(light=SHOWCASE_LIGHT["exterior" if kind == "exterior" else "interior"])
    else:
        text = PROMPT.format(kind="exterior architectural" if kind == "exterior" else "interior")
    room, style = _clean(room), _clean(style)
    if room or style:  # the same words for every photo of one home keep the set consistent
        text += f"\nThis is {'the ' + room + ' of ' if room else ''}a{' ' + style + ' style' if style else 'n'} Indian home; keep that style consistent."
    ref, width, height = _sizes(image_b64)
    last = ""
    for model in models:
        try:
            r = requests.post(base + model, headers={"Authorization": f"Bearer {token}"}, timeout=timeout,
                              data={"prompt": text, "width": str(width), "height": str(height)},
                              files={"input_image_0": ("view.jpg", ref, "image/jpeg")})
        except requests.RequestException as e:
            raise AIError(f"Cloudflare not reachable ({e.__class__.__name__})") from e
        if not r.ok:
            msg = cf_error_message(r)
            if cf_model_missing(r.status_code, msg):  # this model isn't available: try the next one
                last = f"model {model} not found"
                continue
            hint = {401: "the Cloudflare API token was rejected", 403: "this Cloudflare token can't use Workers AI image models",
                    429: "Cloudflare's image limit is reached — try again later"}.get(r.status_code, "")
            raise AIError(f"Cloudflare HTTP {r.status_code}: {hint or msg or 'the image model could not use this picture'}", status=r.status_code)
        img = _image_from(r)
        if img:
            base64.b64decode(img[:64] + "==")  # sanity: it is base64
            return {"image": img, "mime": _mime(img), "model": model}
        last = "Cloudflare answered without an image (the picture may have been blocked by safety filters)"
        break
    raise AIError(last or "no image model available")
