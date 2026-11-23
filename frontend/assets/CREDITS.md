# DIMORA 3D asset credits and licences

## 3D models (`assets/models/`)

Both models come from the Khronos Group **glTF-Sample-Assets** repository
(https://github.com/KhronosGroup/glTF-Sample-Assets). They are used under
**Creative Commons Attribution 4.0 International (CC BY 4.0)**,
https://creativecommons.org/licenses/by/4.0/. That licence allows commercial use if you give credit.

| File in DIMORA | Original model | Author / rights holder | Licence | Changes made for DIMORA |
|---|---|---|---|---|
| `glam_velvet_sofa.glb` | GlamVelvetSofa (`Models/GlamVelvetSofa`) | Wayfair LLC, via Khronos glTF-Sample-Assets | CC BY 4.0 | Images re-encoded as JPEG (still 1024 px) to cut the file from 3.1 MB to 0.66 MB. The fabric colour is set at runtime from the room's theme. |
| `sheen_chair.glb` | SheenChair (`Models/SheenChair`) | Wayfair LLC, via Khronos glTF-Sample-Assets | CC BY 4.0 (also offered under CC0) | Images resized to 1024 px max and re-encoded (4.1 MB → 1.8 MB). The fabric colour is set at runtime; its baked occlusion map (second UV set) is not used. |
| `floor_lamp.glb` | Lamp with Punctual Lights (`Models/LightsPunctualLamp`) | Khronos glTF-Sample-Assets contributors | CC BY 4.0 | Textures downscaled from 2048 px to 1024 px. The unused transmission map was dropped (4.3 MB → 0.67 MB). |

Attribution line, for the app's About page or the README:

> "Glam Velvet Sofa" and "Sheen Chair" © Wayfair LLC, and "Lamp with Punctual Lights" © Khronos Group contributors, from KhronosGroup/glTF-Sample-Assets, licensed under CC BY 4.0. Modified (texture compression).

The full licence text for each model is in its folder of the source repository (`LICENSE.md`). The licence does not cover logos or trademarks, and neither model contains any.

## Textures (`assets/textures/`)

DIMORA generates its own textures procedurally with `tools/gen_textures.py` (repo root). No third-party images are used.

| File | Use |
|---|---|
| `oak_1k.jpg`, `oak_mr_1k.jpg`, `oak_n_1k.jpg` | Oak base colour, roughness and normal maps, used on the coffee table |
| `linen_1k.jpg`, `linen_n_1k.jpg` | Linen weave, used on the curtains |
| `rug_wool_2k.jpg`, `wool_n_1k.jpg` | Wool rug: base colour at 2K because it is large in the room close-up, plus a pile normal map |
| `stone_tile_2k.jpg`, `stone_tile_mr_2k.jpg`, `stone_tile_n_2k.jpg` | Large-format marble-look floor tiles (0.6 m, grout lines, soft sheen), 2K because the floor fills the close-up |
| `oak_planks_2k.jpg`, `oak_planks_mr_2k.jpg`, `oak_planks_n_2k.jpg` | Wide oak floor planks (0.19 m), used for wood floors and the deck |
| `travertine_1k.jpg`, `travertine_n_1k.jpg` | Honed travertine, used on the coffee table |
| `weave_n_512.jpg` | Fine upholstery weave normal map (8 cm repeat), used on procedural upholstery |
| `brick_1k.jpg`, `brick_mr_1k.jpg`, `brick_n_1k.jpg` | Exposed brick in stretcher bond: 230 × 70 mm bricks, 10 mm joints (0.96 m tile) |
| `ledgestone_2k.jpg`, `ledgestone_mr_2k.jpg`, `ledgestone_n_2k.jpg` | Split-face stacked ledgestone cladding: 35–95 mm courses, 150–600 mm stones (1.2 m tile) |
| `plaster_1k.jpg`, `plaster_n_1k.jpg` | Fine sand-float exterior plaster: neutral albedo tinted to the paint colour (2 m tile) |
| `pavers_1k.jpg`, `pavers_mr_1k.jpg`, `pavers_n_1k.jpg` | Concrete pavers 300 × 150 mm in running bond, chamfered joints, tone per piece (1.2 m tile) |
| `ceramic_1k.jpg`, `ceramic_mr_1k.jpg`, `ceramic_n_1k.jpg` | Matte ceramic floor tile with grout (2 × 2 tiles per texture) |
| `granite_1k.jpg` | Polished salt-and-pepper granite (kitchen and vanity counters), tinted at runtime |
| `laminate_1k.jpg`, `laminate_n_1k.jpg` | Straight-grain wood laminate for cabinet shutters |
| `brushed_n_512.jpg` | Brushed stainless steel normal map (appliances, exposed metal) |
| `lawn_2k.jpg`, `lawn_n_2k.jpg`, `lawn_mr_1k.jpg` | Lawn drawn blade by blade from above (~78,000 blades of 18–55 mm, a few dry ones, soil showing through), 1.2 m tile at 2K; blended with a 4× larger copy of itself in the shader so it never visibly repeats |
| `asphalt_1k.jpg`, `asphalt_n_1k.jpg` | Road asphalt with aggregate (3 m tile) |
| `vitrified_2k.jpg`, `vitrified_mr_2k.jpg` | Polished vitrified floor tile, vein-free, with grout (2 × 2 tiles per texture) |

## Private studio additions

- `landing/duplex-concept.webp` is generated architectural concept imagery.
- `textures/neem-foliage.webp` is a generated alpha-cut foliage texture for DIMORA's procedural neem crowns.
- `preview/` contains stills rendered offline from DIMORA’s duplex geometry for browsers without WebGL2.
- `models/defender-110.glb` is an original DIMORA preview model with physically based materials.
