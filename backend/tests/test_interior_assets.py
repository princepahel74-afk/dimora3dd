"""The living-room models and textures ship with the frontend, are served correctly, and are credited."""
import json
import struct
from pathlib import Path

FRONT = Path(__file__).resolve().parents[2] / "frontend"
MODELS = ["glam_velvet_sofa.glb", "floor_lamp.glb", "sheen_chair.glb"]
TEXTURES = ["oak_1k.jpg", "oak_mr_1k.jpg", "oak_n_1k.jpg", "linen_1k.jpg", "linen_n_1k.jpg", "rug_wool_2k.jpg", "wool_n_1k.jpg",
            "stone_tile_2k.jpg", "stone_tile_mr_2k.jpg", "stone_tile_n_2k.jpg", "oak_planks_2k.jpg", "oak_planks_mr_2k.jpg",
            "oak_planks_n_2k.jpg", "travertine_1k.jpg", "travertine_n_1k.jpg", "weave_n_512.jpg",
            "brick_1k.jpg", "brick_mr_1k.jpg", "brick_n_1k.jpg", "ledgestone_2k.jpg", "ledgestone_mr_2k.jpg", "ledgestone_n_2k.jpg",
            "plaster_1k.jpg", "plaster_n_1k.jpg", "pavers_1k.jpg", "pavers_mr_1k.jpg", "pavers_n_1k.jpg", "ceramic_1k.jpg",
            "ceramic_mr_1k.jpg", "ceramic_n_1k.jpg", "granite_1k.jpg", "laminate_1k.jpg", "laminate_n_1k.jpg", "brushed_n_512.jpg",
            "lawn_2k.jpg", "lawn_n_2k.jpg", "lawn_mr_1k.jpg", "asphalt_1k.jpg", "asphalt_n_1k.jpg", "vitrified_2k.jpg", "vitrified_mr_2k.jpg"]


def test_models_are_valid_web_sized_glb():
    for name in MODELS:
        b = (FRONT / "assets/models" / name).read_bytes()
        assert b[:4] == b"glTF" and struct.unpack("<I", b[4:8])[0] == 2
        assert len(b) < 2_000_000, f"{name} should stay web-ready"
        jl = struct.unpack("<I", b[12:16])[0]
        gltf = json.loads(b[20:20 + jl])
        assert gltf["meshes"] and gltf["materials"]


def test_assets_served(client):
    r = client.get("/assets/models/glam_velvet_sofa.glb")
    assert r.status_code == 200 and r.mimetype == "model/gltf-binary"
    for t in TEXTURES:
        assert client.get("/assets/textures/" + t).status_code == 200


def test_assets_credited():
    credits = (FRONT / "assets/CREDITS.md").read_text()
    for name in MODELS + TEXTURES:
        assert name in credits
    assert "CC BY 4.0" in credits and "Wayfair" in credits
