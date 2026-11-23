"""'Make it Real': a Gemini image model turns a screenshot of the 3D view into a photorealistic photo.

Uses the native Gemini REST API (generateContent with an image in and an image out). The model keeps the layout:
same camera, walls, doors, windows and furniture — only materials, light and detail become photographic.
"""
from __future__ import annotations

import base64
import re

import requests

from ..config import settings
from .client import AIError

# tried in order when a model name is not available to the key (names change as Google ships new image models)
FALLBACK_MODELS = ["gemini-3.1-flash-image", "gemini-3.1-flash-image-preview", "gemini-2.5-flash-image"]

PROMPT = """Turn this 3D render of a home into a photorealistic {kind} photograph, like a professional real-estate photo.
KEEP EXACTLY: the same camera angle and framing, every wall, door, window and opening in the same place, the same rooms,
the same furniture in the same positions and sizes, and the same colours and materials (just make them real).
IMPROVE: realistic textures (wood grain, stone, fabric, paint), soft natural daylight with real shadows and bounce light,
reflections on glass and polished floors, small lived-in details that don't change the layout.
Do NOT add or remove furniture, rooms, windows or doors. Do NOT change the architecture. No people, no text, no watermark."""

# the Property Showcase wants brochure photos: same home, but styled and lit like a high-end listing shoot
SHOWCASE_PROMPT = """Turn this simple 3D render of a home into a luxury real-estate listing photograph, as if shot by a top
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


def native_base() -> str:
    """https://…/v1beta/openai → https://…/v1beta (the native API lives next to the OpenAI-compatible one)."""
    return re.sub(r"/openai/?$", "", settings.gemini_url.rstrip("/"))


def _clean(t: str) -> str:
    return re.sub(r"[^\w &/'.,()-]+", " ", str(t or ""))[:60].strip()


def make_real(key: str, image_b64: str, mime: str = "image/jpeg", kind: str = "interior", timeout: float = 120, room: str = "", style: str = "", look: str = "") -> dict:
    if not key:
        raise AIError("No Gemini API key: set GEMINI_API_KEY on the server (or add your own key in Settings).")
    models = [settings.gemini_image_model] + [m for m in FALLBACK_MODELS if m != settings.gemini_image_model]
    if look == "showcase":
        text = SHOWCASE_PROMPT.format(light=SHOWCASE_LIGHT["exterior" if kind == "exterior" else "interior"])
    else:
        text = PROMPT.format(kind="exterior architectural" if kind == "exterior" else "interior")
    room, style = _clean(room), _clean(style)
    if room or style:  # the same words for every photo of one home keep the set consistent
        text += f"\nThis is {'the ' + room + ' of ' if room else ''}a{' ' + style + ' style' if style else 'n'} Indian home; keep that style consistent."
    body = {
        "contents": [{"parts": [{"text": text},
                                {"inline_data": {"mime_type": mime, "data": image_b64}}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
    last = ""
    for model in models:
        try:
            r = requests.post(f"{native_base()}/models/{model}:generateContent", json=body, timeout=timeout,
                              headers={"x-goog-api-key": key, "Content-Type": "application/json"})
        except requests.RequestException as e:
            raise AIError(f"Gemini not reachable ({e.__class__.__name__})") from e
        if r.status_code == 404:  # this model name isn't available: try the next one
            last = f"model {model} not found"
            continue
        if not r.ok:
            try:
                msg = (r.json().get("error") or {}).get("message", "")[:200]
            except ValueError:
                msg = r.text[:200]
            hint = {400: "Gemini could not use this picture", 401: "the Gemini API key was rejected", 403: "this Gemini key can't use image models",
                    429: "Gemini's image limit is reached — try again later"}.get(r.status_code, "")
            raise AIError(f"Gemini HTTP {r.status_code}: {hint or msg}")
        for cand in r.json().get("candidates") or []:
            for part in (cand.get("content") or {}).get("parts") or []:
                data = part.get("inlineData") or part.get("inline_data")
                if data and data.get("data"):
                    base64.b64decode(data["data"][:64] + "==")  # sanity: it is base64
                    return {"image": data["data"], "mime": data.get("mimeType") or data.get("mime_type") or "image/png", "model": model}
        last = "Gemini answered without an image (the picture may have been blocked by safety filters)"
        break
    raise AIError(last or "no image model available")
