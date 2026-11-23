"""AI client. Main AI: Cloudflare Workers AI. Fallbacks: Qwen through Ollama (local) or OpenRouter.

provider = "auto"       → Cloudflare if an account ID and API token are set, then local Ollama, then OpenRouter
provider = "cloudflare" → Cloudflare Workers AI only (needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN)
provider = "ollama"     → local only (free, private)
provider = "openrouter" → OpenRouter only (needs an API key)
("gemini", the old main AI, is read as "cloudflare" so existing settings keep working.)

Every call returns plain text; ask_json() also extracts the JSON object from it.
"""
from __future__ import annotations

import json
import re
import time

import requests

from ..config import settings
from ..dsa.ratelimit import SlidingWindowLimiter

# Shared by every request in this process: protects the server's own Cloudflare / OpenRouter key on a public site.
limiter = SlidingWindowLimiter(settings.ai_per_hour, settings.ai_per_day) if settings.public else None

# Tried in order after the chosen model when Cloudflare says that model doesn't exist (Workers AI retires models often).
CF_FALLBACK_MODELS = ["@cf/qwen/qwen3.8-27b", "@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"]

_ACCOUNT = re.compile(r"[0-9a-fA-F]{32}")
_LEGACY = {"gemini": "cloudflare", "cf": "cloudflare", "workers-ai": "cloudflare"}


class AIError(RuntimeError):
    def __init__(self, message="", status: int | None = None):
        super().__init__(message)
        self.status = status


class AIUnavailable(AIError):
    """No provider is configured or reachable — callers fall back to rule-based logic."""


_THINK = re.compile(r"<think>.*?</think>", re.S)


def extract_json(text: str):
    """Pull the first JSON object/array out of a model reply (handles ```json fences and chatter)."""
    t = _THINK.sub("", str(text)).replace("```json", "").replace("```JSON", "").replace("```", "").strip()
    starts = [i for i in (t.find("{"), t.find("[")) if i >= 0]
    if not starts:
        raise AIError("No JSON in the model reply")
    s = min(starts)
    for e in range(len(t), s, -1):
        if t[e - 1] in "}]":
            try:
                return json.loads(t[s:e])
            except json.JSONDecodeError:
                continue
    raise AIError("Could not parse JSON from the model reply")


def cf_account_url(account: str) -> str:
    """https://api.cloudflare.com/client/v4/accounts/<id> — the ID goes into the URL path, so it must be 32 hex digits."""
    if not _ACCOUNT.fullmatch(account or ""):
        raise AIError("The Cloudflare account ID looks wrong — it is the 32-character ID shown in the Cloudflare dashboard "
                      "(set CLOUDFLARE_ACCOUNT_ID)", status=400)
    return f"{settings.cloudflare_url.rstrip('/')}/accounts/{account.lower()}"


def cf_error_message(r) -> str:
    """The message in a Cloudflare error ({"errors":[{"message":…}]}) or an OpenAI-style one ({"error":{"message":…}})."""
    try:
        j = r.json()
    except ValueError:
        return r.text[:200]
    if isinstance(j, list):
        j = j[0] if j and isinstance(j[0], dict) else {}
    if isinstance(j.get("errors"), list) and j["errors"]:
        e = j["errors"][0]
        return str(e.get("message", e) if isinstance(e, dict) else e)[:200]
    err = j.get("error")
    if isinstance(err, dict):
        return str(err.get("message", r.text[:200]))[:200]
    return str(err or r.text)[:200]


def cf_model_missing(status: int | None, message: str) -> bool:
    """True when Cloudflare is saying 'that model doesn't exist (any more)' rather than 'your request is wrong'."""
    m = (message or "").lower()
    return status == 404 or (status in (400, 410) and ("model" in m or "no route" in m) and
                             any(w in m for w in ("not found", "no such", "does not exist", "no route", "invalid model", "unknown model")))


class AIClient:
    _ollama_cache: dict = {}

    def __init__(self, provider=None, openrouter_key=None, ollama_model=None, openrouter_model=None, ollama_url=None, visitor=None,
                 cloudflare_token=None, cloudflare_account=None, cloudflare_model=None):
        p = (provider or settings.ai_provider or "auto").lower()
        self.provider = _LEGACY.get(p, p)
        # Only calls paid with the server's key are metered; a visitor's own key is theirs to spend.
        self.quota_key = visitor if (limiter and not (openrouter_key or cloudflare_token)) else None
        self.cf_token = cloudflare_token or settings.cloudflare_token
        self.cf_account = (cloudflare_account or settings.cloudflare_account or "").strip()
        self.cf_model = cloudflare_model or settings.cloudflare_model
        self.openrouter_key = openrouter_key or settings.openrouter_key
        self.ollama_model = ollama_model or settings.ollama_model
        self.openrouter_model = openrouter_model or settings.openrouter_model
        self.ollama_url = (ollama_url or settings.ollama_url).rstrip("/")
        self.used = None  # "cloudflare:<model>" / "ollama:<model>" / "openrouter:<model>" after a call
        self._cf_used = None  # the Workers AI model that actually answered (may be a fallback)

    @property
    def cf_configured(self) -> bool:
        return bool(self.cf_token and self.cf_account)

    # ---------- discovery ----------
    def ollama_models(self):
        """List local models (cached for 20 s so every request doesn't ping Ollama)."""
        hit = self._ollama_cache.get(self.ollama_url)
        if hit and time.time() - hit[0] < 20:
            return hit[1]
        try:
            r = requests.get(self.ollama_url + "/api/tags", timeout=1.5)
            models = [m["name"] for m in r.json().get("models", [])] if r.ok else None
        except (requests.RequestException, ValueError):
            models = None
        self._ollama_cache[self.ollama_url] = (time.time(), models)
        return models

    def ollama_ready(self) -> bool:
        models = self.ollama_models()
        if not models:
            return False
        want = self.ollama_model if ":" in self.ollama_model else self.ollama_model + ":latest"
        return any(m == want or m.split(":")[0] == self.ollama_model for m in models)

    def order(self):
        if self.provider == "ollama":
            return ["ollama"]
        if self.provider == "openrouter":
            return ["openrouter"] if self._quota_ok(consume=False) else []
        if self.provider == "cloudflare":  # without an account ID and token there is nothing to call: report "not connected"
            return ["cloudflare"] if self.cf_configured and self._quota_ok(consume=False) else []
        out = []
        if self.cf_configured and self._quota_ok(consume=False):
            out.append("cloudflare")
        if self.ollama_ready():
            out.append("ollama")
        if self.openrouter_key and self._quota_ok(consume=False):
            out.append("openrouter")
        return out

    def _quota_ok(self, consume: bool) -> bool:
        return self.quota_key is None or limiter.check(self.quota_key, consume=consume)

    def status(self):
        models = self.ollama_models()
        return {
            "provider": self.provider,
            "ollama": {"url": self.ollama_url, "running": models is not None, "model": self.ollama_model, "model_installed": self.ollama_ready(), "models": models or []},
            "cloudflare": {"configured": self.cf_configured, "account_set": bool(self.cf_account), "token_set": bool(self.cf_token),
                           "model": self.cf_model, "image_model": settings.cloudflare_image_model},
            "openrouter": {"configured": bool(self.openrouter_key), "model": self.openrouter_model,
                           **({"remaining_this_hour": limiter.remaining(self.quota_key)} if self.quota_key else {})},
            "public": settings.public,
            "active": (self.order() or [None])[0],
        }

    @staticmethod
    def short(model: str) -> str:
        return str(model).rsplit("/", 1)[-1]

    def label(self):
        p = (self.order() or [None])[0]
        return {"cloudflare": f"Cloudflare Workers AI · {self.short(self.cf_model)}", "ollama": f"Qwen · {self.ollama_model} (local)",
                "openrouter": f"OpenRouter · {self.openrouter_model}"}.get(p, "rule-based engine")

    def model_of(self, p):
        return {"cloudflare": self._cf_used or self.cf_model, "ollama": self.ollama_model, "openrouter": self.openrouter_model}[p]

    # ---------- calls ----------
    def chat(self, messages, temperature: float = 0.3, max_tokens: int = 2048, want_json: bool = True, timeout: float | None = None, schema: dict | None = None) -> str:
        """messages: [{'role': 'user'|'assistant'|'system', 'text': str, 'images': [base64 jpeg]}]"""
        providers = self.order()
        if not providers:
            if (self.cf_configured or self.openrouter_key) and not self._quota_ok(consume=False):
                raise AIUnavailable("The free AI allowance for this hour is used up — DIMORA continues with its rule-based engine. "
                                    "Add your own Cloudflare API token in Settings to keep using the AI.")
            raise AIUnavailable("No AI provider: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (Cloudflare Workers AI), "
                                "or start Ollama, or set an OpenRouter key.")
        errors = []
        for p in providers:
            if p in ("openrouter", "cloudflare") and not self._quota_ok(consume=True):
                errors.append(f"{p}: AI allowance used up")
                continue
            try:
                fn = {"ollama": self._ollama, "openrouter": self._openrouter, "cloudflare": self._cloudflare}[p]
                args = (messages, temperature, max_tokens, want_json, timeout or settings.ai_timeout)
                text = _THINK.sub("", fn(*args, schema=schema) if p == "cloudflare" else fn(*args)).strip()
                if not text:
                    raise AIError("Empty reply")
                self.used = f"{p}:{self.model_of(p)}"
                return text
            except AIError as e:
                errors.append(f"{p}: {e}")
        raise AIError("; ".join(errors))

    def ask_json(self, prompt: str, images=None, **kw):
        return extract_json(self.chat([{"role": "user", "text": prompt, "images": images or []}], **kw))

    def _ollama(self, messages, temperature, max_tokens, want_json, timeout):
        body = {
            "model": self.ollama_model, "stream": False, "think": False,
            "messages": [{"role": m["role"], "content": m.get("text", ""), **({"images": m["images"]} if m.get("images") else {})} for m in messages],
            "options": {"temperature": temperature, "num_predict": max_tokens, "top_p": 0.8, "top_k": 20},
        }
        if want_json:
            body["format"] = "json"
        for attempt in range(2):
            try:
                r = requests.post(self.ollama_url + "/api/chat", json=body, timeout=timeout)
            except requests.RequestException as e:
                raise AIError(f"Ollama not reachable ({e.__class__.__name__})") from e
            if r.status_code == 400 and "think" in r.text and attempt == 0:
                body.pop("think", None)  # older Ollama / non-thinking model
                continue
            if not r.ok:
                raise AIError(f"Ollama HTTP {r.status_code}: {r.text[:200]}")
            return (r.json().get("message") or {}).get("content", "")
        raise AIError("Ollama rejected the request")

    @staticmethod
    def _content(m):
        if not m.get("images"):
            return m.get("text", "")
        return [{"type": "text", "text": m.get("text", "")}] + [{"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + b}} for b in m["images"]]

    def _openai_style(self, name, url, headers, body, hints, timeout, optional):
        """POST an OpenAI-format chat request; on HTTP 400 drop optional params one at a time and retry."""
        for _ in range(len(optional) + 1):
            try:
                r = requests.post(url, json=body, headers=headers, timeout=timeout)
            except requests.RequestException as e:
                raise AIError(f"{name} not reachable ({e.__class__.__name__})") from e
            if r.status_code == 400 and not cf_model_missing(400, cf_error_message(r)):
                drop = next((k for k in optional if k in body), None)
                if drop:
                    body.pop(drop)
                    continue
            if not r.ok:
                msg = cf_error_message(r)
                missing = cf_model_missing(r.status_code, msg)  # reported as 404 so callers can try another model
                raise AIError(f"{name} HTTP {r.status_code}: {hints.get(r.status_code) or msg}", status=404 if missing else r.status_code)
            j = r.json()
            if isinstance(j.get("result"), dict) and "choices" not in j:  # Cloudflare's {"result": {...}} envelope
                j = j["result"]
            msg = (j.get("choices") or [{}])[0].get("message") or {}
            return msg.get("content") or ""
        raise AIError(f"{name} rejected the request")

    def _cloudflare(self, messages, temperature, max_tokens, want_json, timeout, schema=None):
        """Workers AI through its OpenAI-compatible endpoint: /accounts/<id>/ai/v1/chat/completions."""
        if not self.cf_configured:
            raise AIError("Cloudflare Workers AI needs both CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN")
        url = cf_account_url(self.cf_account) + "/ai/v1/chat/completions"
        models = [self.cf_model] + [m for m in CF_FALLBACK_MODELS if m != self.cf_model]
        last = None
        for model in models:
            body = {"model": model, "max_tokens": max_tokens, "temperature": temperature, "reasoning_effort": "low",
                    "messages": [{"role": m["role"], "content": self._content(m)} for m in messages]}
            if schema:  # structured output: the model must answer in exactly this JSON shape
                body["response_format"] = {"type": "json_schema", "json_schema": {"name": "dimora_plan", "schema": schema}}
            elif want_json:
                body["response_format"] = {"type": "json_object"}
            hints = {401: "the Cloudflare API token was rejected — check CLOUDFLARE_API_TOKEN",
                     403: "this Cloudflare token can't use Workers AI — give it the Workers AI permission and check CLOUDFLARE_ACCOUNT_ID",
                     404: f"Workers AI model {model} not found — set CLOUDFLARE_MODEL to a current model",
                     429: "Cloudflare Workers AI limit reached — the free daily allowance may be used up; try later or move to Workers Paid"}
            try:
                out = self._openai_style("Cloudflare", url, {"Authorization": f"Bearer {self.cf_token}"}, body, hints, timeout,
                                         ["reasoning_effort", "temperature", "response_format"])
                self._cf_used = model
                return out
            except AIError as e:
                if e.status != 404:  # a bad token, a limit, a network error: another model won't help
                    raise
                last = e
        raise last or AIError("No Workers AI model available")

    def _openrouter(self, messages, temperature, max_tokens, want_json, timeout):
        body = {"model": self.openrouter_model, "temperature": temperature, "max_tokens": max_tokens,
                "messages": [{"role": m["role"], "content": self._content(m)} for m in messages],
                "reasoning": {"enabled": False}}
        if want_json:
            body["response_format"] = {"type": "json_object"}
        headers = {"Authorization": f"Bearer {self.openrouter_key}", "HTTP-Referer": "https://github.com/dimora", "X-Title": "DIMORA"}
        hints = {401: "the API key was rejected — check OPENROUTER_API_KEY", 402: "the OpenRouter account is out of credits",
                 403: "this key isn't allowed to use that model", 404: f"model {self.openrouter_model} not found",
                 429: "rate-limited by OpenRouter — try again in a moment"}
        return self._openai_style("OpenRouter", settings.openrouter_url + "/chat/completions", headers, body, hints, timeout,
                                  ["response_format", "reasoning"])


def client_from_request(headers, body=None, visitor=None) -> AIClient:
    """Per-request overrides from the frontend's AI settings (headers win over .env).

    On a public site a visitor must not be able to make the server call an arbitrary URL, so the
    Ollama URL override is ignored there (the server's own OLLAMA_URL still applies). A visitor's
    Cloudflare account ID only ever fills the /accounts/<id> part of the fixed Cloudflare API URL."""
    body = body or {}
    return AIClient(
        provider=headers.get("X-AI-Provider") or body.get("ai_provider"),
        openrouter_key=headers.get("X-OpenRouter-Key") or None,
        ollama_model=headers.get("X-Ollama-Model") or None,
        openrouter_model=headers.get("X-OpenRouter-Model") or None,
        cloudflare_token=headers.get("X-Cloudflare-Token") or None,
        cloudflare_account=headers.get("X-Cloudflare-Account") or None,
        cloudflare_model=headers.get("X-Cloudflare-Model") or None,
        ollama_url=None if settings.public else (headers.get("X-Ollama-Url") or None),
        visitor=visitor,
    )
