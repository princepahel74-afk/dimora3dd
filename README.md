> For the password-protected Render setup in this export, follow [RENDER.md](RENDER.md).

# DIMORA — AI floor plan → 3D home designer

Upload a 2D floor plan (single floor or multi-storey). DIMORA detects the walls, rooms, doors, windows and stairs, then builds a furnished 3D home. You can walk through it, edit it, budget it in ₹, and tour it with **Aria**, the AI guide.

Version 2 moves the engine into a **Python backend** built on data structures and algorithms, and uses **Cloudflare Workers AI** as its AI (v3.9, before that Google Gemini; local Qwen through Ollama and OpenRouter remain as fallbacks).

```
 Browser (frontend/)                         Python backend (backend/)                      AI
 ───────────────────                         ─────────────────────────                      ──
 3D WebGL2 renderer, 2D SVG editor,  ─HTTP→  Flask REST API (app.py)                  ─→  Cloudflare Workers AI
 walk mode, tour camera, panels               ├─ vision/   OpenCV: sheet split, walls,       qwen3.8-27b + FLUX.2 (CLOUDFLARE_*)
                                              │            rooms, wall thickness, PDF        fallbacks: Ollama, OpenRouter
                                              ├─ dsa/      geometry, interval merging,
                                              │            spatial grid, room graphs
                                              ├─ planner/  rooms, doors, windows, floor
                                              │            ordering, alignment, stairs,
                                              │            graph analytics, tour order
                                              └─ ai/       prompts + JSON validation
```

## What's new in v3.9: Cloudflare Workers AI replaces Google Gemini

- **One provider for every AI feature.** Plan reading, Aria, tour narration, style matching, the report summary and the 3 ideas now run on [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) through its OpenAI-compatible endpoint (`/accounts/<id>/ai/v1/chat/completions`). The default model is `@cf/qwen/qwen3.8-27b`, which reads images; Llama 4 Scout and Mistral Small 3.1 can be picked in ⚙ Settings. If Cloudflare retires the chosen model, DIMORA moves on to the next one by itself.
- **Make it Real** uses a FLUX.2 image model on Workers AI (`@cf/black-forest-labs/flux-2-klein-9b`, falling back to `flux-2-dev`, then `flux-2-klein-4b`). The 3D view is sent as a reference image (Workers AI takes up to 512 × 512), and the photo comes back at 1280 px in the same shape as the view.
- **Setup:** set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` (see [Connect the AI](#connect-the-ai-cloudflare-workers-ai)). `GEMINI_API_KEY` is no longer used. An old `DIMORA_AI_PROVIDER=gemini` setting is read as `cloudflare`.
- Ollama and OpenRouter still work as fallbacks.

## What's new in v3.8: sharper, more realistic lawn

- **New lawn texture:** a 1.2 m tile drawn blade by blade at 2K, with its own normal map and roughness map (`frontend/assets/textures/lawn_*`). Close up you can now see individual blades instead of a green blur.
- **No visible repeat:** the lawn texture is blended with a second, larger-scale copy of itself, plus soft colour variation, so the tiling pattern disappears across big lawns.
- **Crisper at an angle:** textures now use up to 16x anisotropic filtering, so the lawn stays sharp when viewed from a low camera.
- **Denser 3D grass blades:** taller two-segment blades in four natural green tones, visible up to 34 m from the camera.
- **Fix:** grass chunks are now culled by their own position (previously measured from the world origin), so far-off grass is hidden correctly.

## What's new in v3.7: a real street and neighbourhood around every house

- **City block around the plot.** `buildNeighbourhood()` lays this out in the plot's own street frame, so it adapts to any plot size and road side and is seeded from the project, so it does not change between rebuilds.
  - **Street edge:** footpaths on both sides, kerbs, a dropped kerb with a concrete crossover at the gate, and an asphalt carriageway.
  - **Neighbours:** cross streets close the block. Neighbour plots line up on both sides of this one, across the road and behind it, with party and compound walls.
  - **Buildings:** G+1 to G+3 houses in Indian pastel plaster with windows on every side, sunshades, balconies, terrace parapets, stair head-rooms and water tanks. One low-rise apartment block stands across the road, with more apartments and a small shopping centre with its parking farther out.
  - **Street furniture:** street lights, which glow after dusk, street trees and a few parked cars.
  - Anything in the default street-view camera's line of sight is left out.
- **Landscaping.**
  - The lawn is a real-scale grass texture with large-scale colour variation.
  - Grass blades grow in the plot's planted areas, built in 4 m chunks that are drawn only near the camera. Paths, paving, yards, the gate drive and the house stay clear.
  - Trees and shrubs get soft contact shadows. Areca palms and ashoka trees join the neem-style trees.
- **Details.** Bevelled wall copings and pillar caps, a soft contact shadow around the house base, lighter atmospheric haze, and textured asphalt roads.
- **Engine.** Parts can carry `maxDist`, so small details (grass, windows, railings, cars, lamps) are skipped beyond that distance in both the colour and shadow passes. World-mapped textures get gentle large-scale variation, so big walls and lawns don't show an obvious repeat.

## What's new in v3.6: materials pass

- **One shared material pass.** Every part the engine draws goes through `upgradeMaterial()`, so generated homes, saved homes and every floor pick this up automatically. In High and Medium quality, procedural finishes become real-scale image PBR tinted to the chosen colour:
  - brick in stretcher bond, 230 × 70 mm with 10 mm joints;
  - split-face ledgestone with 35–95 mm courses;
  - fine matte plaster on exterior and boundary walls;
  - 300 × 150 mm concrete pavers and smaller setts.
  Textures are mapped in metres in world space, so brick and stone courses line up around corners and openings.
- **Gate and railings.** Gate bars are powder-coated steel with eased edges that catch a soft highlight. A brushed stainless pull handle sits on the leading edge.
- **Floors by finish.**
  - Polished vitrified tile is vein-free and glossy, and marble keeps its veining.
  - Matte ceramic is satin. Bathroom anti-skid tile is the least glossy.
  - Wood floors are oak planks at the catalogue plank width.
- **Furniture surfaces.**
  - Wardrobes and tall cabinet panels get vertical grain. Wood-toned cabinet shutters get laminate grain; painted ones stay matte.
  - Counters are polished granite. Appliance steel and large metal parts get a brushed grain.
  - Pillows and duvets use the fine fabric weave.

## What's new in v3.5: showcase quality for every generated home

- **Any room, lit by its own openings.** Whenever you stand in a room, whether through the guided room view, Walk mode or a tour, that room's real windows become area lights. Doorways count too: a doorway onto the outdoors is bright, one onto another room is dim. Exposure adapts to how much daylight the room actually gets. Rooms with small windows or none get a soft overhead light, so inner bathrooms and passages stay readable.
- **Guided views for the whole house.** The pill reads **Exterior › one button per floor › main room**. On a cutaway, clicking any enclosed room (bedroom, kitchen, bath…) glides into an eye-level shot of it. The shot frames the room's main piece (bed, counter, vanity…), keeps windows in view and avoids tall pieces right in front of the lens.
- **Materials in every room.** All timber furniture uses the oak texture tinted to the theme's wood colour. Stone tops use travertine. Floors use real-scale tiles or planks, including balcony decks. Upholstery uses the fine weave, and curtains are pleated linen.
- **Generated homes keep their design.** Room geometry, doors, windows, floors and theme are unchanged. The showcase-only glass wall and deck stay limited to the sample duplex.

## What's new in v3.4: photoreal showcase living room

- **Daylight from the glass.** In the room view, each window of the room is a rectangular area light, computed with the exact Lambert form factor. Walls and ceiling block the rest of the sky. The floor and walls near the glass are brighter and the light falls off deeper into the room. A small bounced-light term fills the shadows, and analytic occlusion darkens corners and wall–floor junctions. Glossy floors and the coffee table reflect the bright opening. The view outside is held back, so the room, the cream upholstery and the garden all keep detail.
- **Glass wall and deck in the duplex showcase.** The window behind the sofa becomes floor-to-ceiling glazing on the same wall, kept clear of the main door. It opens onto a timber deck with a frameless glass balustrade. A neighbourhood of houses and street trees across the road gives the view depth.
- **Materials and models.** The floors are now large-format marble-look tiles and oak planks at real scale. The coffee table is a bevelled travertine pill top on a pedestal. The lounge chair is a Wayfair velvet chair (CC BY 4.0). Upholstery uses a fine woven normal map instead of the noisy procedural speckle. Sheer linen curtains have irregular folds, reach the floor and glow when backlit. The skirting is thicker and wall-coloured.

## What's new in v3.3: furnished living room and guided views

- **Guided views.** A pill at the bottom of the 3D view runs **Exterior › Ground floor › Living Room**. In the ground-floor cutaway, clicking the living room also flies you in. The camera glides into an eye-level corner shot that frames the sofa, the window and the depth of the room. **← Back to floor** returns you to the same floor camera you came from. The cutaway and the room view show the same walls, windows and furniture.
- **Real 3D furniture (GLB).** The engine now loads `.glb` models with PBR textures (base colour, metal/roughness, normal and occlusion maps, plus a sheen approximation for velvet). The 3-seater sofa and the floor lamp use licensed models. While a model is downloading, or in Low quality, the old procedural furniture is shown instead.
- **Textured materials.** The coffee table is oak, the rug is hand-knotted wool (2K, since it fills the close-up), and the curtains are pleated linen. All three are DIMORA's own generated textures, at 1K except the rug.
- **Interior light.** In the room view a warm lamp light comes on, soft sky light falls through each window, the ambient light is lower and the exposure is tuned for the room. Glass seen from inside stops washing out the view of the garden and road. Soft contact shadows sit under free-standing furniture.
- **Placement.** Living rooms size the rug to the room and seat it under the sofa's front legs. The floor lamp goes at a sofa end, clear of door swings, walls and other furniture.
- Sources and licences for all models and textures: `frontend/assets/CREDITS.md` (models are CC BY 4.0, from KhronosGroup/glTF-Sample-Assets).

## What's new in v3.1 — Property Showcase

A cinematic, scroll-driven page for any design, like a luxury real-estate site.

- **🎬 Showcase** button (top toolbar). Scroll to move through: the house at dusk → the plot → the roof lifting off → a dollhouse with every room and size → a stop in each room → a "Book a visit" finale.
- **✨ Make it photoreal.** One click asks Google Gemini for a realistic photo of the outside and of every room (up to 8 photos). They fade in over the 3D during the scroll, and are saved with the project. Needs `GEMINI_API_KEY`; counts against the daily photo limit (`DIMORA_PHOTOS_PER_DAY`, default 12).
- Showcase photos use a **brochure prompt**: Gemini keeps the walls, windows, doors and furniture layout, but restyles each room like a luxury listing shoot (designer furniture, real materials, styling, warm lights; the outside at dusk). With photos, each room stop becomes a full-screen photo with a slow push-in, and a **Gallery** strip shows them all with names and sizes.
- **Share this showcase** creates a `/?show=<id>` link. Anyone can open it on a phone or laptop without logging in; the photos come along.
- On the landing page, the new **Property Showcase** example opens a ready-made one.

## What's new in v3.0 (realistic-3d)
Built for the **Google Startup Buildathon India 2026**. Try it with `samples/dimora_test_plan_2bhk.png`.

1. **Gemini reads the whole plan** (`backend/dimora_core/ai/plan_schema.py`): every room with its name, type and size in feet, open-plan areas, doors (main / sliding / hinged), windows, balcony, porch with steps, parking with cars, front and back gardens with trees, plot, gate, road side and north arrow. Gemini answers in a strict JSON schema (structured output); DIMORA validates it and fills Indian defaults: 10 ft ceiling, 7 ft doors, 3 ft window sills, 9-inch outer and 4.5-inch inner walls. If the reading is incomplete it falls back to computer vision + AI labels.
2. **Realistic 3D:**
   - the house stands on a 45 cm plinth, with stone steps at the porch or main door;
   - floors suit each room: wood in bedrooms, vitrified tiles or marble in living, dining and passage, anti-skid tiles in kitchen and bathrooms, concrete in the store;
   - doors swing into the room they close, and there is a sliding glass door to the balcony;
   - plot wall, gate and road are placed as drawn, with trees and cars where the plan shows them;
   - warm indoor light, soft shadows, ambient occlusion and ACES tone mapping, with a Low/High quality switch in Settings;
   - first-person walk mode with on-screen arrows for phones.
3. **✨ Make it Real** (3D toolbar): Gemini's image model (`gemini-3.1-flash-image`, with fallbacks) turns the current view into a photorealistic photo with the same layout. The popup has a before/after slider and a download button. Each person gets 12 photos a day (one full showcase) (`DIMORA_PHOTOS_PER_DAY`).
4. **Revit-style tools:**
   - edit in 2D and the 3D view updates live;
   - **📋 Summary** shows a room list with sq ft and the total built-up area (1,440 sq ft for the test plan), plus sunlight and Vastu hints (general guidance);
   - **PDF summary**, **GLB 3D model** download and a **view-only share link** (`/?view=<id>`);
   - **💡 3 ideas**: Gemini suggests 3 design options to preview, with a rule-based fallback.
5. **New landing page:** one-line headline, *Try it free*, before/after slider, 3-step how-it-works, examples that open without uploading, Free vs Pro prices, FAQ.

**Limitations:**
- Textures are procedural. Poly Haven and ambientCG could not be downloaded in the build environment; see `frontend/assets/LICENSES.txt`.
- The GLB export carries colours and materials but not the procedural patterns.
- Share links are stored by the backend database, so on Cloud Run use `DATABASE_URL` to keep them across restarts.

## Run DIMORA on your computer (step by step)
1. Install **Python 3.11** from https://www.python.org/downloads/ (Windows: tick "Add python.exe to PATH").
2. Download this repository (GitHub → Code → Download ZIP) and unzip it, or `git clone` it.
3. Open a terminal in the project folder and run:
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate            # Windows
   # source .venv/bin/activate       # macOS / Linux
   pip install -r requirements.txt
   copy .env.example .env             # Windows   (macOS / Linux: cp .env.example .env)
   ```
4. Open `backend/.env` in Notepad and fill in `CLOUDFLARE_ACCOUNT_ID=` and `CLOUDFLARE_API_TOKEN=` (see [Connect the AI](#connect-the-ai-cloudflare-workers-ai)).
5. Start it: `python app.py`, then open **http://127.0.0.1:8000** in Chrome.
6. Click **Try it free** → upload `samples/dimora_test_plan_2bhk.png`, or open the 2BHK example from the landing page.

### Environment variables
| Variable | Needed? | What it does |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | **Yes**, for AI features | Your 32-character Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | **Yes**, for AI features | A Cloudflare API token with the Workers AI permission. Never put it in code or GitHub. |
| `CLOUDFLARE_MODEL` | No (default `@cf/qwen/qwen3.8-27b`) | Workers AI model that reads plans, powers Aria and the 3 ideas (it must accept images) |
| `CLOUDFLARE_IMAGE_MODEL` | No (default `@cf/black-forest-labs/flux-2-klein-9b`) | Workers AI image model for "Make it Real" |
| `DIMORA_PHOTOS_PER_DAY` | No (default 12) | "Make it Real" photos per user per day |
| `DIMORA_AI_PROVIDER` | No (default `auto`) | `cloudflare` to use only Cloudflare Workers AI |
| `DATABASE_URL` | Recommended on Cloud Run | Postgres URL for accounts and share links (SQLite file otherwise) |
| `DIMORA_PUBLIC` | Set `1` on a public site | Rate-limits AI calls paid with your key |

## Deploy on Google Cloud Run
You need a Google Cloud project with billing enabled; new accounts get free credits. Then, in **Cloud Shell** (the `>_` icon in the Google Cloud console):
```bash
git clone https://github.com/<your-user>/dimoratry.git && cd dimoratry && git checkout realistic-3d
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
# keep the Cloudflare API token in Secret Manager (it never goes into the code)
printf "%s" "PASTE_YOUR_CLOUDFLARE_TOKEN" | gcloud secrets create cloudflare-api-token --data-file=-
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding cloudflare-api-token --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role=roles/secretmanager.secretAccessor
# build from the Dockerfile and deploy (Mumbai region)
gcloud run deploy dimora --source . --region asia-south1 --allow-unauthenticated \
  --memory 2Gi --cpu 2 --timeout 300 \
  --set-env-vars DIMORA_PUBLIC=1,DIMORA_AI_PROVIDER=cloudflare,DIMORA_PHOTOS_PER_DAY=12,CLOUDFLARE_ACCOUNT_ID=YOUR_ACCOUNT_ID \
  --set-secrets CLOUDFLARE_API_TOKEN=cloudflare-api-token:latest
```
Cloud Run prints the website URL (`https://dimora-xxxx.a.run.app`). Then:
- **Google sign-in:** in Firebase Console → Authentication → Settings → Authorized domains, add the `…run.app` address.
- **Saved accounts and share links:** Cloud Run's disk is temporary. Create a free Postgres database (e.g. neon.tech) or Cloud SQL, and add `--set-env-vars DATABASE_URL=postgresql://…` (or store it as a secret too). Homes of people who sign in with Google are already saved in Cloud Firestore.
- **Update later:** `git pull` and run the same `gcloud run deploy` command again.

## Run it

**Windows:** double-click `run.bat`. **macOS / Linux:** `./run.sh`.
Then open **http://127.0.0.1:8000**.

Or by hand:
```bash
cd backend
python -m venv .venv && . .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                               # optional settings
python app.py
```

Without an AI connected, everything still works. The computer vision runs on the backend, and Aria uses a rule-based parser. If the backend isn't running at all, the page falls back to a simpler in-browser engine.

## Connect the AI (Cloudflare Workers AI)

DIMORA's AI is **Cloudflare Workers AI** (default model `@cf/qwen/qwen3.8-27b`; photos by `@cf/black-forest-labs/flux-2-klein-9b`).

**Setup (5 minutes):**
1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com) (a free account works) and open **AI → Workers AI**.
2. Click **Use REST API**. Copy your **account ID**, then click **Create a Workers AI API token** and copy the token.
3. Open `backend/.env` (created from `.env.example` the first time you run `run.bat`) and set `CLOUDFLARE_ACCOUNT_ID=…` and `CLOUDFLARE_API_TOKEN=…`.
4. Restart the backend. ⚙ **Settings → Test AI** should say *Cloudflare Workers AI · qwen3.8-27b*.

**Cost:** the Workers Free plan includes a daily allowance of Workers AI usage, enough for testing. For a busy public site, move to Workers Paid. Some newer models on Workers AI need a paid plan; the error message says so when that happens.

**Models:** set `CLOUDFLARE_MODEL` in `.env`, or pick one in ⚙ Settings. It must accept images, because it reads floor plans:
- `@cf/qwen/qwen3.8-27b` (recommended);
- `@cf/meta/llama-4-scout-17b-16e-instruct` (fastest);
- `@cf/mistralai/mistral-small-3.1-24b-instruct`.

**Fallbacks:** with `DIMORA_AI_PROVIDER=auto` (the default), DIMORA uses Cloudflare when both the account ID and the token are set. Otherwise it tries local Qwen through [Ollama](https://ollama.com) (`ollama pull qwen3.5:9b`), then OpenRouter (`OPENROUTER_API_KEY`). To force one, set `DIMORA_AI_PROVIDER` to `cloudflare`, `ollama` or `openrouter`.

**What the AI does in DIMORA:**
- names rooms and reads the scale, doors, windows, stairs and floor titles;
- splits a sheet that holds several floors when you force a floor count;
- powers Aria's actions;
- writes the tour narration;
- matches the style of an inspiration photo;
- writes the report summary.

The AI never edits the home directly. It returns JSON that the backend validates.

## Accuracy: what the detector handles
- **Many drawing styles:** CAD drawings, coloured or watercolour presentation plans, scans and sheets with several floors. Walls are found first (thick grey or black strokes). Text, furniture, dimension lines, grid bubbles and colour washes are ignored.
- **Open-plan spaces:** an L-shaped living/dining/kitchen is kept as one connected space, split into rectangles with no wall between them.
- **Doors and windows from the drawing:** a door is a gap with a swing arc beside it, and a window is a gap with glazing lines across it. The main entrance is the widest outside door.
- **Balconies:** a balcony is recognised by its open railing side.
- **Stairs:** found from their tread lines, even without AI.
- **Fix anything before generating:** on the detection screen you can select and move rooms; **＋ Room** (drag), **＋ Door** and **＋ Window** (click a wall) add items; **Delete** (or the Del key) removes them. You can also rename rooms and change their type in the list.
- **For the best results:**
  - Connect Cloudflare Workers AI: it reads room names, printed dimensions and floor titles.
  - Or type the real plan width.
  - Use the original PDF or a high-resolution image.

## Multi-floor plans
You can upload any of these:
- one sheet with every floor on it;
- a multi-page PDF;
- several images at once, one per floor.

The backend then:
1. splits the sheet into one plan per floor;
2. orders the floors (the AI's reading, then the printed title, then the file name, then the position on the sheet);
3. gives plans on the same sheet the same scale;
4. aligns each floor over the one below (stair matching with the Hungarian algorithm, plus maximum footprint overlap);
5. fits a staircase so its top step lands in a room upstairs.

## REST API

| Method | Path | Does |
|---|---|---|
| GET | `/api/health` | backend version and AI status (Ollama / OpenRouter) |
| POST | `/api/plans/detect` | multipart `files[]` (PNG/JPG/WEBP/PDF), `width_m`, `floors`, `use_ai` → floors in metres plus detection overlays and a log |
| POST | `/api/plans/restack` | re-order floors, then re-align and re-connect the stairs |
| POST | `/api/analyze` | room-graph analytics: BFS order, chokepoints, Dijkstra walking distances, stair geometry, whole-house connectivity |
| POST | `/api/tour` | tour order across floors |
| POST | `/api/assistant` | Aria: `{text, home, action_doc, history}` → `{reply, actions}` |
| POST | `/api/narration` | tour narration for each room |
| POST | `/api/inspiration` | inspiration photo → style, colours, floor, finish |
| POST | `/api/report-summary` | executive summary for the report |
| POST | `/api/ai/test` | a one-line check that the AI answers |
| POST | `/api/auth/signup` · `/api/auth/login` | `{email, password, name}` → `{user, token}` (send as `Authorization: Bearer <token>`) |
| POST | `/api/auth/logout` | end this session |
| GET · PATCH · DELETE | `/api/auth/me` | profile; update `{name, prefs}`; delete account (`{password}`) |
| POST | `/api/auth/password` | `{old, new}` → new token (other sessions are signed out) |
| GET | `/api/projects` | your saved homes (summaries) |
| GET · PUT · DELETE | `/api/projects/<id>` | open, save `{project, summary}`, delete one home |

AI endpoints return **503 `ai_unavailable`** when no model is connected; the frontend then uses its rule-based fallbacks. To choose the provider per request, send the headers `X-AI-Provider`, `X-Cloudflare-Account`, `X-Cloudflare-Token`, `X-Cloudflare-Model`, `X-OpenRouter-Key`, `X-OpenRouter-Model` and `X-Ollama-Model`.

## Tests
```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest -q             # 70 tests: DSA units + API (AI mocked, incl. a fake Cloudflare Workers AI server)
python tests/fake_ollama.py     # optional: a fake Ollama on :11434 for end-to-end runs with no GPU
```

## Project layout
```
backend/
  app.py                      Flask app: API routes + serves frontend/
  dimora_core/
    config.py                 settings (.env), room types, ids
    dsa/geometry.py           rectangles, overlap, rectangle difference, shared walls
    dsa/intervals.py          interval merging, wall lines (hash map), 1-D single-linkage clustering
    dsa/spatial.py            uniform-grid spatial hash for point → room queries
    dsa/graph.py              room-adjacency graph: sweep-line, BFS, Tarjan, Dijkstra, whole-house graph
    vision/loader.py          image/PDF decoding (OpenCV, pypdfium2)
    vision/walls.py           wall-first detection: walls, gaps → doors/windows, outline, rooms → rectangles, stairs
    vision/rooms.py           classic detector (fallback) + scale estimate
    vision/sheet.py           splitting a multi-plan sheet
    planner/layout.py         pixels → metres, room typing, snapping, doors/windows (union-find de-dup)
    planner/floors.py         floor names/levels, alignment (Hungarian matching), stair fitting
    planner/analysis.py       graph analytics and tour order
    ai/client.py              Cloudflare Workers AI (main), Ollama/OpenRouter fallbacks, JSON extraction
    ai/services.py            prompts and validation of every AI answer
    pipeline.py               uploads → finished floors
  tests/                      pytest suite + fake Ollama, OpenRouter and Cloudflare servers
frontend/                     the web app (HTML/CSS/JS, WebGL2 3D engine)
docs/DSA.md                   every data structure and algorithm, with complexity
samples/                      two one-floor plans to try
```

## Real walls, real stairs, real-home feel (v2.11)
- **Rooms never overlap.** In the 2D plan, dragging a room's edge works like moving a real wall:
  - a smaller room that shares that wall resizes along with it (e.g. widen Bedroom 2 and its attached bath gets narrower);
  - any other room is a hard stop, and the plan shows "Stopped by …";
  - doors and windows in the moved wall travel with it, and furniture stays inside the room.
- **Moving a room** onto another one turns it red; letting go puts it back where it was. A new room can't be drawn on top of an existing one.
- **Typed sizes and Aria** ("make the guest room 6 × 6") follow the same rules. If one side is blocked, the room grows the other way, or stops and says what is in the way.
- **Stairs stay inside walls.** After any edit, each staircase is fitted inside the room it stands in (shortened to a minimum of 2.2 m, or turned, if needed). It also slides so no upstairs wall crosses the stair opening. A room holding a staircase can't be shrunk smaller than the flight needs.
- **Feels like a home, not a game:**
  - warm indoor light instead of blue-grey walls;
  - natural walking speed that eases in and out, with a normal (60°) field of view;
  - you can't walk through beds and sofas;
  - ceiling fans in living rooms and bedrooms, and modular switch boards beside doors;
  - calmer wood floors, more natural trees and lawn, and light room labels;
  - furniture settles into place instead of dropping from the sky;
  - plain wording ("arrow keys to walk") instead of gaming terms.

## Indian design styles & realism (v2.10)
- **Softer, more realistic furniture:** a rounded-box mesh gives mattresses, cushions and upholstery soft rounded edges; wood and cabinets get a small bevel. Ambient occlusion is gentler and cleaner. The *Low* graphics setting keeps plain boxes for weak devices.
- **Two Indian themes** (Design → Theme, or ask Aria, e.g. "give my home a traditional Indian look"):
  - **Indian Contemporary:** walnut/sheesham wood, terracotta and mustard block prints, brass, Makrana marble. Adds a wooden jhoola, a brass urli and a deepstambh (plus a pooja unit if the home has no pooja room).
  - **Modern Traditional Indian:** carved teak, Athangudi patterned tiles, maroon and peacock green, brass. Adds a diwan with bolsters, a wooden jaali screen, an urli and a deepstambh; double beds become carved teak beds.
- **What the Indian themes change in 3D:**
  - block-print fabrics on cushions, bolsters and bedspreads;
  - a hand-painted floral stencil on the wall behind the TV and behind each bed;
  - wall colours, floors and wood tones.
- Switching to another theme removes the Indian pieces again and restores regular beds.
- **New "Indian" furniture tab:** jhoola, diwan, jaali screen, brass urli, brass deepstambh, carved teak bed.

## Google Sign-In & Cloud Firestore (v2.9)
DIMORA uses **Firebase Authentication** for real "Continue with Google" sign-in, and **Cloud Firestore** to keep each person's homes and preferences. Both work on Firebase's free Spark plan.

- **Where the data lives:**
  - `users/{uid}` holds the profile, intro answers and design preferences.
  - `users/{uid}/projects/{id}` holds a home's name, date and dashboard summary.
  - `…/chunks/{n}` holds the home itself, split into ~700 KB pieces, because a Firestore document holds at most 1 MiB.
- **Security:** `firestore.rules` lets each signed-in user read and write only their own `users/{uid}` folder. Paste it into Firebase Console → Firestore → Rules → Publish.
- **Config:** the Firebase web config is in `AUTH_CONFIG.firebase` in `frontend/js/app.js` (project `dimora-e5001`). It is public by design; the security rules protect the data.
- **Before Google sign-in works on a new address,** add the address in Firebase Console → Authentication → Settings → Authorized domains, e.g. `dimora-xxxx.onrender.com` or your Cloud Run URL. `localhost` is allowed by default.
- **Email + password accounts** on the DIMORA server still work as a second option on the sign-in screen.
- If a browser blocks the Google popup, DIMORA falls back to a full-page redirect sign-in.

## Google Gemini AI (v2.8)
- Gemini replaces Qwen as DIMORA's main AI for plan reading, Aria, tour narration, style matching and reports.
- Set `GEMINI_API_KEY` (free from Google AI Studio). Ollama and OpenRouter still work as fallbacks.
- ⚙ Settings has a Gemini model picker and an optional per-browser Gemini key.

## Modern villa exteriors & garages (v2.7)
Your 2D plan now comes out looking like a finished modern house (the Planner 5D style):
- **Exterior styles** (Design panel → *Exterior style*, or ask Aria "make the outside a modern villa"):
  - **Modern villa** (default): white render, stacked-stone feature walls on the ground floor, a timber-batten band between floors, slim black window frames and a thin dark flat roof that overhangs the walls.
  - **Classic Indian**: plaster, stone plinth, moulded bands, window chajjas and a parapet roof terrace.
  - **Brick & white**: exposed red-brick volumes with white render.
  - *Outside paint* swatches or a custom colour override the wall colour; *Style default* resets it.
- **Garages**: a room labelled GARAGE on your plan, or any room you turn into one (Space → Transform → *Garage*), gets these on its outside wall:
  - a timber portal and a rolled-up door with an LED strip;
  - a detailed SUV parked nose-out, plus a motorbike if there's room;
  - a cobblestone driveway straight to a wide gate in the boundary wall.
  - If the garage sticks out past the floor above, it gets its own roof with an overhang. A balcony on top of it gets glass railings.
- **Cars**: open car porches and parking drawn on the plan use the same detailed SUV.
- **Landscaping**: lush shrub clusters line the front of the house and the footpath.
- **Roofs**: recessed balconies and small enclosed gaps in the plan (ducts, shafts) are covered by the roof, so the top looks solid.
- The sample duplex (*Try a sample* → duplex) shows all of it.

## Keyboard controls (v2.6.1)
| Where | Keys |
|---|---|
| **3D view** (fly around the outside) | **W A S D** or arrows: glide · **Q / E**: circle the house · **Z / X**: zoom in / out · **T / G**: higher / lower viewing angle · **Shift**: faster · drag to orbit, right-drag to pan, wheel to zoom |
| **🚶 Walk outside** (3D toolbar) | Starts you at the gate at eye level, facing the house. **W A S D** or arrows to walk around the garden, parking and paths, then in through the front door. Drag to look around · **Shift** to hurry · **Esc** to leave |
| **Walk** (inside) | **W A S D**: walk · ←/→: turn · stairs take you between floors · walk out of the main door to explore outside · **Esc** to leave |

Walls, balcony railings and the boundary wall stop you; doorways let you through. The keys are ignored while you type in a text box, and **⌨ WASD** in the toolbar shows this help.

## The complete app (v2.6)
**Your Cloudflare API token goes on the server, never in the page.** (Since v3.9; v2.6–v3.8 used a Gemini key the same way.)
- On your PC, open `backend/.env` (copied from `.env.example` the first time you run `run.bat`). Set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`, then restart.
- On Render, set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` under *Environment*. `render.yaml` asks for both when you create the Blueprint.
- ⚙ Settings → *Test AI* checks it. Clear messages tell you if the key is wrong, the model name is out of date, or you've hit the free-tier limit.
- Visitors never see the key. In public mode (`DIMORA_PUBLIC=1`), each visitor gets an hourly allowance.

**Accounts and cloud save**
- Sign up with email and password. Passwords are stored as salted scrypt hashes, and sessions are random tokens of which only the hash is stored.
- Homes, chat history and preferences save to your account automatically (☁ chip in the top bar) and open on any device. Homes made before signing in move into the account.
- Account settings let you change your password (this signs out other devices) or delete the account and all its homes.
- *Continue without an account* keeps everything in this browser only. That's also what happens automatically when the server can't be reached.
- **Storage.** By default it's a SQLite file in `backend/data/`, which is fine on your own PC. Render's free plan wipes its disk on every restart, so for a public site create a free Postgres database:
  1. Sign up at neon.tech (or supabase.com), create a project and copy its connection string.
  2. Set it as `DATABASE_URL` on Render.

**Installable app.** DIMORA is a Progressive Web App.
- In Chrome or Edge, click *⤓ Install app* (landing page or dashboard), or use the browser menu → *Install*. On Android, choose *Add to Home screen*.
- On iPhone, tap Share → *Add to Home Screen*.
- It opens full screen with its own icon. Opened without internet, it still starts, and the 3D viewer and your device projects work. Plan reading, AI and sync come back when you're online.

**Aria, the chatbot**
- **With the AI connected,** Aria gets the real facts of your home: sizes, areas, cost per room, daylight, design checks and your budget. It answers with those numbers and can change the home. Its actions cover paint, flooring, furniture, themes, room transformations, resizing, budget fitting, ceilings, lighting, time of day, views, floors, facade colour, roof and cutaway, and saving variants.
- It remembers the conversation per home, and the chat history is saved with the home.
- It replies in English, Hindi or Hinglish.
- **Without the AI,** an on-device engine still carries out commands and answers questions: counts, sizes, costs (per room and against your budget), daylight, parking and garden.

**Tested.**
- 46 backend tests: accounts, privacy between users, plan reading, multi-floor, plots, and AI parsing.
- An automated click-through of every panel and button: no dead buttons, no errors.
- End-to-end runs of sign-up → design → sync → second device, and of the chatbot through an OpenRouter-compatible test server (`backend/tests/fake_openrouter.py`).

## Balconies, parking and gardens (v2.5)
- **Open-air spaces** are three room types: *Balcony*, *Car Parking* and *Garden*. In 3D they have no ceiling and no walls to the outside.
  - **Balconies** get a modern railing: a low upstand, frameless glass, steel posts and handrail. They have a deck floor and outdoor furniture. The house wall behind a balcony gets the exterior finish, with the stone plinth, sills and sunshades.
  - **Car parking** gets interlocking pavers, white bay lines, up to three cars, and a car porch on slim steel columns, unless a floor above already covers it.
  - **Gardens and parks** get lawn, trees or shrubs (depending on width), flower beds, a stepping-stone path, a bench and garden lights.
- **Detection (backend).** A compound wall or plot line drawn around the house is recognised as the plot, not as house walls. The open ground between the house and the plot is cut into areas.
  - With the AI connected, labels such as *PARKING*, *CAR PORCH*, *GARDEN* or *LAWN* name them.
  - Without AI, the largest area that fits a car (2.5 × 5 m) becomes the parking and the rest becomes garden.
  - The plan's scale is still taken from the house, not the plot.
- **Site.** When the plan includes yards, the boundary wall follows the plot and the gate opens onto the parking.
- **Manual control.** In the detection screen or the 2D editor, draw a rectangle and set its type to Balcony, Car Parking or Garden. The browser-only mode (no backend) needs this, because it doesn't detect plots.
- The built-up area and room count leave out parking and garden.

## Multi-storey buildings (v2.4)
- **Several plans on one sheet** (side by side, stacked, three or more floors) are separated into floors, ordered by their titles, aligned, and connected with staircases.
- **Architect sheets with a drawing border and title block are read correctly.** The frame used to join every plan into one giant floor. It's now recognised (it spans the sheet but is almost empty inside) and ignored, and title-block text is never mistaken for a floor.
- **Several files or PDF pages** are read as one floor each.
- **Typical floors.** If a building has more storeys than plans drawn, set *Storeys in the building* (up to 15) before uploading and the top plan is repeated upwards. After detection you can also click **＋ Add floor above** to copy the floor you're viewing as a new storey, with a staircase up to it.
- **Detector accuracy fixes.**
  - Openings in thick outer walls (doors and windows) are found, so rooms next to the front door no longer leak outside.
  - A door right beside a window is split into a door and a window.
  - Bold room labels and size text are no longer read as walls or used to cut rooms apart.

## Realistic 3D (v2.3)
The WebGL2 engine renders the house in a photo-like style. Everything is generated in code, so there are no texture files to download:
- **Materials with depth and shine.** Every surface has roughness and reflections, and procedural relief (bump mapping) adds wood grain and plank gaps, tile grout, marble veins, brick and stone joints, plaster texture, grass and leaves.
- **Light.** The sun follows the time slider with soft shadows. The sky has a gradient, a sun glow and clouds. Moonlight and stars appear at night, warm interior lights come on, and ACES filmic tone mapping keeps colours natural.
- **Post-processing.** 4× anti-aliasing (MSAA) smooths edges, screen-space ambient occlusion adds soft shading where surfaces meet, and a light vignette frames the view.
- **The house.** Outside walls get a textured plaster finish with a stone plinth and floor bands, and rooms get skirting boards. Windows have tinted reflective glass, charcoal frames with mullions, stone sills and concrete sunshades (chajjas). The main door is panelled, with a canopy, a step and a wall light.
- **The plot.** A lawn, paved apron and path lead to a boundary wall with a gate, pillars and lamps. There are trees, hedges and shrubs, with the street in front.
- **Roof.** The "Roof" button in the 3D toolbar shows the finished terrace with tiles, a parapet with coping and a water tank.
- **Quality setting.** ⚙ Settings → Graphics → 3D quality offers Ultra, High, Balanced and Low. Phones default to Balanced. Without WebGL2 post-processing support the engine falls back automatically.

## Publish it as a website for everyone
DIMORA is one Flask app that serves both the website and the API, so it deploys as a **single web
service**. The repo includes `render.yaml` (one-click Render setup), a `Dockerfile` (for Railway, Fly.io,
Koyeb, Cloud Run or a VPS) and a `Procfile`.

**1. Get an AI key (2 min).** Sign in at openrouter.ai, then Keys → Create key. Set a **credit limit** on
the key (for example $5), because the public uses your credits. A server can't run Ollama without a GPU,
so the hosted site uses OpenRouter.

**2. Put the project on GitHub (5 min).**
- Create a free account at github.com, then New repository → name it `dimora` → Create.
- Click "uploading an existing file". Drag in everything *inside* the DIMORA folder (backend, frontend,
  docs, samples, render.yaml, Dockerfile, …), then Commit.
- ⚠ Never upload `backend/.env`. It holds your key, and the key goes into Render instead.

**3. Deploy on Render (5–10 min).**
- Sign up at render.com with your GitHub account, then New → Blueprint → choose the `dimora` repo.
- When asked for `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`, paste your Cloudflare account ID and Workers AI token, then click Apply.
- The first build takes about 5 minutes. Your site is then live at `https://dimora-xxxx.onrender.com`.
  Share that link.
- Every change you push to GitHub redeploys the site automatically. Settings → Custom Domains lets you
  attach your own domain.

**What the free plan means.** The site sleeps after 15 minutes without visitors, and the next visitor waits
about a minute while it wakes. It also has a small CPU, so plan detection takes longer than on your PC.
The Starter instance ($7/month) stays awake and is faster.

**Public-site protection** (on by default in `render.yaml` and the Dockerfile with `DIMORA_PUBLIC=1`):
- Each visitor gets `DIMORA_AI_PER_HOUR` AI calls an hour on your key (default 20). The whole site gets
  `DIMORA_AI_PER_DAY` (default 500). After that DIMORA quietly continues with its rule-based engine.
- Visitors who paste their own Cloudflare token (or OpenRouter key) in ⚙ Settings use their own credits and aren't limited.
- Visitors can't make your server call other addresses. The Ollama-URL override is ignored.
- Uploads are capped at `DIMORA_MAX_UPLOAD_MB`.

**Other hosts.** With Docker: `docker build -t dimora . && docker run -p 8000:8000 -e CLOUDFLARE_ACCOUNT_ID=… -e CLOUDFLARE_API_TOKEN=… dimora`.
Static-only hosts (GitHub Pages, Netlify, Vercel) can serve `frontend/`, but they run the simpler
in-browser engine unless ⚙ Settings → Backend URL points at a running DIMORA backend.

Cost figures are illustrative estimates, not market quotes. Structural notes are indicative only: consult a licensed architect or engineer.
