"""Structured floor-plan reading with Gemini (plan format v2).

Gemini is asked to read the whole drawing — printed room names and sizes, walls, doors, windows and the outside
(balcony, porch with steps, parking, gardens, trees, gate, road) — and answer in ONE strict JSON format (in feet).
Everything it returns is validated here and turned into a DIMORA floor in metres. Anything missing gets a sensible
Indian-home default: 10 ft ceiling, 7 ft doors, 3 ft window sills, 9-inch outer and 4.5-inch inner walls.
"""
from __future__ import annotations

from ..config import ROOM_TYPES, uid
from ..dsa.geometry import r2

FT = 0.3048
TAG = "DIMORA-PLAN-V2"  # marks the prompt (handy for tests and logs)

DEFAULTS = {"ceiling_ft": 10.0, "door_h_ft": 7.0, "window_sill_ft": 3.0, "window_h_ft": 4.0, "outer_wall_in": 9.0, "inner_wall_in": 4.5}

# room types Gemini may use → DIMORA room types
TYPE_MAP = {
    "living": "living", "drawing": "living", "hall": "hall", "passage": "hall", "corridor": "hall", "lobby": "hall", "foyer": "hall",
    "dining": "dining", "kitchen": "kitchen", "bedroom": "bedroom", "master": "master", "master_bedroom": "master", "guest": "guest",
    "kids": "bedroom", "bathroom": "bathroom", "toilet": "bathroom", "wc": "bathroom", "washroom": "bathroom",
    "store": "store", "storage": "store", "utility": "utility", "wash": "utility", "laundry": "utility", "pooja": "pooja",
    "study": "study", "office": "office", "closet": "closet", "dress": "closet", "staircase": "hall", "stairs": "hall",
    "balcony": "balcony", "terrace": "balcony", "sitout": "porch", "sit_out": "porch", "porch": "porch", "verandah": "porch",
    "parking": "parking", "car_parking": "parking", "garage": "garage", "garden": "garden", "lawn": "garden",
    "front_garden": "garden", "back_garden": "garden", "courtyard": "garden", "gym": "gym", "nursery": "nursery",
}
OUTSIDE = {"balcony", "porch", "parking", "garden"}

_num = {"type": "number"}
_box = {"x": _num, "y": _num, "w": _num, "d": _num}
SCHEMA = {
    "type": "object",
    "properties": {
        "house": {"type": "object", "properties": {"width_ft": _num, "depth_ft": _num, "storeys": _num}, "required": ["width_ft", "depth_ft"]},
        "plot": {"type": "object", "properties": {**_box}, "nullable": True},
        "north": {"type": "string", "enum": ["up", "down", "left", "right", "unknown"]},
        "road_side": {"type": "string", "enum": ["N", "S", "E", "W", "unknown"]},
        "ceiling_ft": {"type": "number", "nullable": True},
        "walls": {"type": "object", "properties": {"outer_in": _num, "inner_in": _num}},
        "rooms": {"type": "array", "items": {"type": "object", "properties": {
            "name": {"type": "string"}, "type": {"type": "string"}, **_box,
            "steps": {"type": "number", "nullable": True}, "cars": {"type": "number", "nullable": True}, "railing": {"type": "boolean", "nullable": True},
            "trees": {"type": "array", "items": {"type": "object", "properties": {"x": _num, "y": _num}}}},
            "required": ["name", "type", "x", "y", "w", "d"]}},
        "open_areas": {"type": "array", "items": {"type": "array", "items": {"type": "string"}}},
        "doors": {"type": "array", "items": {"type": "object", "properties": {
            "x": _num, "y": _num, "width_ft": _num, "kind": {"type": "string", "enum": ["main", "hinged", "sliding", "opening"]},
            "rooms": {"type": "array", "items": {"type": "string"}}}, "required": ["x", "y", "kind"]}},
        "windows": {"type": "array", "items": {"type": "object", "properties": {"x": _num, "y": _num, "width_ft": _num}, "required": ["x", "y"]}},
        "gate": {"type": "object", "properties": {"x": _num, "y": _num, "width_ft": _num}, "nullable": True},
        "notes": {"type": "string"},
    },
    "required": ["house", "rooms", "doors", "windows"],
}

PROMPT = f"""[{TAG}] You are an expert Indian architect reading a 2D house floor plan for a 3D home app.
Read EVERYTHING printed on the drawing: room names, room sizes (like 18'-0" x 12'-0"), overall dimensions, the north arrow, notes.

Coordinates: feet. Origin (0,0) = the top-left OUTER corner of the house's built area as drawn; x grows to the right, y grows downward.
Every rectangle is {{x, y, w, d}} = left, top, width (along x), depth (along y), in feet. Rooms inside the house must tile the
house rectangle without gaps or overlaps (use the printed sizes; they add up to the overall house width/depth).

Return:
- house: width_ft, depth_ft (the built area, not the plot), storeys.
- plot: the plot boundary rectangle (if drawn), in the same coordinates (it can start at negative x/y).
- north: which way the north arrow points on the page; road_side: which side of the plot the road is on (N/S/E/W of the page: N = top).
- ceiling_ft and walls (outer_in, inner_in) if printed.
- rooms: EVERY room and EVERY outside area. type is one of: living, dining, kitchen, bedroom, master, guest, bathroom, toilet, store,
  utility, pooja, study, passage, balcony, porch, parking, garden, garage, staircase.
  Outside areas (balcony, porch / sit-out, parking, front garden, back garden) are rooms too, placed where they are drawn (outside the house
  rectangle, e.g. y < 0 behind the house). For a porch give "steps" (number of steps up). For parking give "cars". For a garden give
  "trees" as centre points. A balcony has "railing": true.
- open_areas: groups of room names that form one open space with no wall between them (e.g. ["Living Room", "Dining", "Passage"]).
- doors: centre point of every door ON its wall line, width_ft, kind = main (the main entrance), sliding (sliding / glass door),
  hinged, or opening (an open doorway); and the two rooms it joins.
- windows: centre point ON the wall line and width_ft.
- gate: centre point and width on the plot boundary, if drawn.
Do not invent rooms that are not drawn. Respond with JSON only."""


def _f(v, lo=-500.0, hi=500.0):
    try:
        v = float(v)
    except (TypeError, ValueError):
        return None
    return v if lo <= v <= hi else None


def room_type(t: str, name: str = "") -> str:
    k = str(t or "").strip().lower().replace(" ", "_").replace("-", "_").replace("/", "_")
    if k in ROOM_TYPES and k not in ("hall",):
        return k
    if k in TYPE_MAP:
        return TYPE_MAP[k]
    n = str(name or "").lower()
    for word, typ in (("toilet", "bathroom"), ("bath", "bathroom"), ("store", "store"), ("utility", "utility"), ("passage", "hall"),
                      ("porch", "porch"), ("sit", "porch"), ("parking", "parking"), ("garden", "garden"), ("balcony", "balcony"),
                      ("kitchen", "kitchen"), ("dining", "dining"), ("living", "living"), ("master", "master"), ("bed", "bedroom")):
        if word in n:
            return typ
    return "empty"


def validate(raw) -> tuple[dict, list[str]]:
    """Clean Gemini's JSON: drop broken entries, clamp numbers, fill defaults. Returns (plan, warnings)."""
    warn: list[str] = []
    raw = raw if isinstance(raw, dict) else {}
    house = raw.get("house") if isinstance(raw.get("house"), dict) else {}
    plan = {
        "house": {"width_ft": _f(house.get("width_ft"), 6, 400), "depth_ft": _f(house.get("depth_ft"), 6, 400), "storeys": int(_f(house.get("storeys"), 1, 20) or 1)},
        "north": raw.get("north") if raw.get("north") in ("up", "down", "left", "right") else "up",
        "road_side": raw.get("road_side") if raw.get("road_side") in ("N", "S", "E", "W") else None,
        "ceiling_ft": _f(raw.get("ceiling_ft"), 7, 20) or DEFAULTS["ceiling_ft"],
        "walls": {"outer_in": DEFAULTS["outer_wall_in"], "inner_in": DEFAULTS["inner_wall_in"]},
        "rooms": [], "open_areas": [], "doors": [], "windows": [], "plot": None, "gate": None,
    }
    w = raw.get("walls") if isinstance(raw.get("walls"), dict) else {}
    plan["walls"]["outer_in"] = _f(w.get("outer_in"), 3, 24) or DEFAULTS["outer_wall_in"]
    plan["walls"]["inner_in"] = _f(w.get("inner_in"), 2, 12) or DEFAULTS["inner_wall_in"]
    if plan["ceiling_ft"] == DEFAULTS["ceiling_ft"] and _f(raw.get("ceiling_ft"), 7, 20) is None:
        warn.append("No ceiling height printed — using 10 ft.")
    names = set()
    for r in raw.get("rooms") or []:
        if not isinstance(r, dict):
            continue
        x, y, ww, d = (_f(r.get(k)) for k in ("x", "y", "w", "d"))
        if None in (x, y, ww, d) or ww < 1.5 or d < 1.5:
            warn.append(f"Skipped a room with an unreadable size: {str(r.get('name'))[:30]}")
            continue
        name = str(r.get("name") or "").strip()[:40] or "Room"
        base, k = name, 2
        while name.lower() in names:  # unique names: "Bedroom", "Bedroom (2)"
            name, k = f"{base} ({k})", k + 1
        names.add(name.lower())
        t = room_type(r.get("type"), name)
        room = {"name": name, "type": t, "x": x, "y": y, "w": ww, "d": d}
        if t == "porch":
            room["steps"] = int(_f(r.get("steps"), 0, 12) or 3)
        if t == "parking":
            room["cars"] = int(_f(r.get("cars"), 0, 6) if _f(r.get("cars"), 0, 6) is not None else 1)
        if t == "balcony":
            room["railing"] = r.get("railing") is not False
        trees = [(tx, ty) for tx, ty in ((_f(p.get("x")), _f(p.get("y"))) for p in (r.get("trees") or []) if isinstance(p, dict)) if tx is not None and ty is not None]
        if trees:
            room["trees"] = trees
        plan["rooms"].append(room)
    known = {r["name"].lower(): r["name"] for r in plan["rooms"]}
    for g in raw.get("open_areas") or []:
        if isinstance(g, list):
            grp = [known[str(n).lower()] for n in g if str(n).lower() in known]
            if len(grp) >= 2:
                plan["open_areas"].append(grp)
    for dd in raw.get("doors") or []:
        if not isinstance(dd, dict):
            continue
        x, y = _f(dd.get("x")), _f(dd.get("y"))
        if x is None or y is None:
            continue
        kind = dd.get("kind") if dd.get("kind") in ("main", "hinged", "sliding", "opening") else "hinged"
        dw = _f(dd.get("width_ft"), 1.5, 16) or (3.5 if kind == "main" else 6.0 if kind == "sliding" else 3.0)
        plan["doors"].append({"x": x, "y": y, "width_ft": dw, "kind": kind})
    for wd in raw.get("windows") or []:
        if not isinstance(wd, dict):
            continue
        x, y = _f(wd.get("x")), _f(wd.get("y"))
        if x is not None and y is not None:
            plan["windows"].append({"x": x, "y": y, "width_ft": _f(wd.get("width_ft"), 1, 16) or 4.0})
    pl = raw.get("plot") if isinstance(raw.get("plot"), dict) else None
    if pl and None not in (_f(pl.get(k)) for k in ("x", "y", "w", "d")):
        plan["plot"] = {k: _f(pl.get(k)) for k in ("x", "y", "w", "d")}
    gt = raw.get("gate") if isinstance(raw.get("gate"), dict) else None
    if gt and _f(gt.get("x")) is not None and _f(gt.get("y")) is not None:
        plan["gate"] = {"x": _f(gt.get("x")), "y": _f(gt.get("y")), "width_ft": _f(gt.get("width_ft"), 3, 40) or 12.0}
    inside = [r for r in plan["rooms"] if r["type"] not in OUTSIDE]
    if inside and not plan["house"]["width_ft"]:
        plan["house"]["width_ft"] = max(r["x"] + r["w"] for r in inside) - min(r["x"] for r in inside)
    if inside and not plan["house"]["depth_ft"]:
        plan["house"]["depth_ft"] = max(r["y"] + r["d"] for r in inside) - min(r["y"] for r in inside)
    if not any(d["kind"] == "main" for d in plan["doors"]):
        warn.append("No main door marked — DIMORA will choose the entrance.")
    return plan, warn


def usable(plan: dict) -> bool:
    """Is this structured reading complete enough to build the home from directly?"""
    inside = [r for r in plan["rooms"] if r["type"] not in OUTSIDE]
    if len(inside) < 2 or not plan["house"]["width_ft"] or not plan["house"]["depth_ft"]:
        return False
    hw, hd = plan["house"]["width_ft"], plan["house"]["depth_ft"]
    covered = sum(r["w"] * r["d"] for r in inside)
    return 0.7 * hw * hd <= covered <= 1.3 * hw * hd  # rooms roughly fill the house rectangle


def built_up_sqft(plan: dict) -> float:
    return round(sum(r["w"] * r["d"] for r in plan["rooms"] if r["type"] not in OUTSIDE), 1)


def _edges(rooms):
    """All room edges as (orientation, line coordinate, from, to) in metres."""
    out = []
    for r in rooms:
        out += [("h", r["y"], r["x"], r["x"] + r["w"]), ("h", r["y"] + r["d"], r["x"], r["x"] + r["w"]),
                ("v", r["x"], r["y"], r["y"] + r["d"]), ("v", r["x"] + r["w"], r["y"], r["y"] + r["d"])]
    return out


def _snap(x, y, edges, built_only=None, tol=0.6):
    """Put a door/window centre exactly on the nearest wall line (within tol metres)."""
    best = None
    for o, c, a, b in edges:
        t, n = (x, y) if o == "h" else (y, x)
        if a - 0.05 <= t <= b + 0.05:
            dist = abs(n - c)
            if dist <= tol and (best is None or dist < best[0]):
                best = (dist, o, c, t)
    return best


def to_floor(plan: dict):
    """Validated plan (feet) → (DIMORA floor dict in metres, extras for the project)."""
    m = lambda v: r2(v * FT)  # noqa: E731
    floor = {"rooms": [], "doors": [], "windows": [], "stairs": []}
    group_of = {}
    for gi, grp in enumerate(plan["open_areas"]):
        for n in grp:
            group_of[n] = f"open{gi + 1}"
    for r in plan["rooms"]:
        room = {"id": uid("r"), "name": r["name"], "type": r["type"], "x": m(r["x"]), "y": m(r["y"]), "w": m(r["w"]), "d": m(r["d"])}
        if r["name"] in group_of:
            room["group"] = group_of[r["name"]]
        for k in ("steps", "cars", "railing"):
            if k in r:
                room[k] = r[k]
        if r.get("trees"):
            room["trees"] = [[m(tx), m(ty)] for tx, ty in r["trees"]]
        floor["rooms"].append(room)
    walls = [x for x in floor["rooms"] if x["type"] not in ("parking", "garden")]  # doors & windows sit on house / balcony / porch walls
    edges = _edges(walls)
    built = [x for x in floor["rooms"] if x["type"] not in OUTSIDE]
    for d in plan["doors"]:
        s = _snap(m(d["x"]), m(d["y"]), edges)
        if not s:
            continue
        _, o, c, t = s
        door = {"id": uid("d"), "o": o, "x": r2(t if o == "h" else c), "y": r2(c if o == "h" else t), "w": r2(max(0.7, min(4.8, d["width_ft"] * FT)))}
        if d["kind"] == "main":
            door["main"] = True
        if d["kind"] == "sliding":
            door["sliding"] = True
        if d["kind"] == "opening":
            door["open"] = True
        floor["doors"].append(door)
    bedges = _edges(built)
    sill = r2(DEFAULTS["window_sill_ft"] * FT)
    for wd in plan["windows"]:
        s = _snap(m(wd["x"]), m(wd["y"]), bedges)
        if not s:
            continue
        _, o, c, t = s
        ww = r2(max(0.5, min(4.0, wd["width_ft"] * FT)))
        small = ww <= 0.75  # ventilators in toilets sit high
        floor["windows"].append({"id": uid("w"), "o": o, "x": r2(t if o == "h" else c), "y": r2(c if o == "h" else t), "w": ww,
                                 "sill": 1.5 if small else sill, "h": 0.6 if small else r2(DEFAULTS["window_h_ft"] * FT)})
    extras = {
        "height": m(plan["ceiling_ft"]) + 0.15,  # ceiling + slab
        "wall_thickness": {"ext": r2(plan["walls"]["outer_in"] * 0.0254), "int": r2(plan["walls"]["inner_in"] * 0.0254)},
        "north": {"up": 0, "right": 90, "down": 180, "left": 270}.get(plan["north"], 0),
        "site": {"plot": {k: m(v) for k, v in plan["plot"].items()} if plan["plot"] else None, "road": plan["road_side"],
                 "gate": {"x": m(plan["gate"]["x"]), "y": m(plan["gate"]["y"]), "w": m(plan["gate"]["width_ft"])} if plan["gate"] else None},
        "built_up_sqft": built_up_sqft(plan),
    }
    return floor, extras
