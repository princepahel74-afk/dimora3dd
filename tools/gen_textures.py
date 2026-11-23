"""DIMORA's own tileable PBR textures (generated here, no third-party content): oak wood, wool rug, linen weave.
Base colour is sRGB; *_mr is glTF-style (G = roughness, B = metalness); *_n is a tangent-space normal map (+Y up)."""
import numpy as np, sys
from PIL import Image
out = sys.argv[1]; rng = np.random.default_rng(7)
def noise(n, lo, hi, aniso=(1, 1)):  # periodic band-limited noise via FFT, in [0,1]
    f = np.fft.fftfreq(n)[:, None] * n, np.fft.fftfreq(n)[None, :] * n
    r = np.hypot(f[0] * aniso[0], f[1] * aniso[1]); m = ((r >= lo) & (r <= hi)).astype(float) / np.maximum(r, 1)
    x = np.real(np.fft.ifft2(np.fft.fft2(rng.standard_normal((n, n))) * m)); return (x - x.min()) / (np.ptp(x) + 1e-9)
def save(a, name, q=90): Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).save(f'{out}/{name}', quality=q, optimize=True); print(name)
def normal_from(h, k):
    gy, gx = np.gradient(h); gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) / 2; gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) / 2
    n = np.dstack([-gx * k, gy * k, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True); return n * 0.5 + 0.5
# --- oak: long grain along x, rays and pores ---
N = 1024; y = np.linspace(0, 1, N, endpoint=False)[:, None]; x = np.linspace(0, 1, N, endpoint=False)[None, :]
warp = noise(N, 1, 3, (0.08, 1)) * 0.9 + noise(N, 4, 12, (0.1, 1)) * 0.12
rings = np.sin((y * 34 + warp * 3.0) * 2 * np.pi) * 0.5 + 0.5
fine = noise(N, 60, 260, (0.03, 1)); pores = (noise(N, 150, 500, (0.05, 1)) > 0.8).astype(float)
t = 0.45 * rings ** 3 + 0.45 * fine + 0.1 * noise(N, 2, 8)
light, dark = np.array([0.80, 0.63, 0.45]), np.array([0.52, 0.36, 0.22])
oak = light * (1 - t[..., None]) + dark * t[..., None]; oak *= (1 - 0.18 * pores[..., None])
save(oak, 'oak_1k.jpg'); rough = 0.42 + 0.22 * t + 0.2 * pores
save(np.dstack([np.zeros_like(rough), rough, np.zeros_like(rough)]), 'oak_mr_1k.jpg')
save(normal_from(t * 0.6 - pores * 0.5, 3.0), 'oak_n_1k.jpg', 92)
# --- linen weave (curtains): warp/weft threads with slub irregularities ---
N = 1024; T = 96  # threads per tile
u = np.arange(N)[None, :] / N * T; v = np.arange(N)[:, None] / N * T
thx = np.abs(np.sin(u * np.pi)); thy = np.abs(np.sin(v * np.pi)); over = ((np.floor(u) + np.floor(v)) % 2)[..., None][..., 0]
slub = noise(N, 1, 6, (1, 0.1)) * 0.6 + noise(N, 1, 6, (0.1, 1)) * 0.4
h = np.where(over > 0.5, thx * 0.8 + thy * 0.2, thy * 0.8 + thx * 0.2) * (0.75 + 0.5 * slub)
lin = np.array([0.93, 0.89, 0.82])[None, None, :] * (0.86 + 0.16 * h[..., None]) * (0.95 + 0.08 * noise(N, 2, 10)[..., None])
save(lin, 'linen_1k.jpg'); save(normal_from(h, 2.2), 'linen_n_1k.jpg', 92)
# --- hand-knotted wool rug, 2K (prominent in the close-up): field, medallion-free geometric lattice, double border, fringe-free ---
N = 2048; yy, xx = np.mgrid[0:N, 0:N] / N
d = np.minimum.reduce([xx, 1 - xx, yy, 1 - yy])
field, border, motif, edge = np.array([0.80, 0.74, 0.64]), np.array([0.36, 0.30, 0.25]), np.array([0.62, 0.42, 0.30]), np.array([0.22, 0.20, 0.19])
col = np.broadcast_to(field, (N, N, 3)).copy()
lat = (np.abs(np.sin(xx * np.pi * 14 + yy * np.pi * 10)) < 0.06) | (np.abs(np.sin(xx * np.pi * 14 - yy * np.pi * 10)) < 0.06)
inner = d > 0.12; col[lat & inner] = col[lat & inner] * 0.35 + motif * 0.65
band = (d > 0.045) & (d < 0.1); col[band] = border; zig = band & (np.abs(np.sin((xx + yy) * np.pi * 60)) > 0.85); col[zig] = motif
col[d < 0.03] = edge; col[(d >= 0.1) & (d < 0.108)] = edge
abrash = noise(N, 1, 5, (1, 0.3))[..., None]; tuft = noise(N, 300, 800)[..., None]
col = col * (0.9 + 0.16 * abrash) * (0.9 + 0.16 * tuft)
save(col, 'rug_wool_2k.jpg', 88)
w = noise(1024, 60, 220) * 0.7 + noise(1024, 6, 30) * 0.3; save(normal_from(w, 6.0), 'wool_n_1k.jpg', 92)
# --- v3.4 showcase: large-format stone tiles (0.6 m, 2 x 2 per texture), wide oak planks, travertine, fine upholstery weave ---
N = 2048; yy, xx = np.mgrid[0:N, 0:N] / N
turb = noise(N, 1, 3) * 0.55 + noise(N, 3, 8) * 0.3 + noise(N, 8, 24) * 0.15
f1 = (xx * 1.0 + yy * 0.55) * np.pi * 2 * 1.5 + turb * 7.0; f2 = (xx * 0.4 - yy * 1.1) * np.pi * 2 * 2 + turb * 9.0
vein = (1 - np.abs(np.sin(f1))) ** 26 * 0.22 + (1 - np.abs(np.sin(f2))) ** 60 * 0.12
cloud = noise(N, 3, 18) * 0.06 + noise(N, 40, 160) * 0.025
tx, ty = (xx * 2) % 1, (yy * 2) % 1; tid = (np.floor(xx * 2) + 2 * np.floor(yy * 2))
shade = 1 + (tid - 1.5) * 0.012  # tiny tile-to-tile variation, like real batches
grout = ((np.minimum.reduce([tx, 1 - tx, ty, 1 - ty]) * 1200) < 1.6)
st = np.dstack([0.95 - vein * 0.55 - cloud, 0.935 - vein * 0.6 - cloud, 0.91 - vein * 0.66 - cloud]) * shade[..., None]
st[grout] = [0.62, 0.6, 0.57]; save(st, 'stone_tile_2k.jpg', 90)
r = np.full((N, N), 0.16) + cloud * 0.6; r[grout] = 0.75; save(np.dstack([np.zeros_like(r), r, np.zeros_like(r)]), 'stone_tile_mr_2k.jpg')
gh = np.zeros((N, N)); gh[grout] = -1.0; save(normal_from(gh * 0.5 + cloud * 0.4, 4.0), 'stone_tile_n_1k.jpg'.replace('1k', '2k'), 92)
# wide oak planks: 8 planks of 0.19 m across the 1.52 m texture, staggered butt joints
N = 2048; yy, xx = np.mgrid[0:N, 0:N] / N; pl = np.floor(yy * 8); rng2 = np.random.default_rng(3)
offs = rng2.random(8); tone = 0.9 + 0.2 * rng2.random(8)
lx = (xx + offs[pl.astype(int)]) % 1; seg = np.floor(lx * 2); butt = (np.abs((lx * 2) % 1) * 1520 < 1.2) | (((yy * 8) % 1) * 190 < 0.9)
gw = noise(N, 1, 4, (0.05, 1)); grain = np.sin((yy * 8 * 18 + gw * 6 + seg * 3.1 + offs[pl.astype(int)] * 20) * np.pi * 2) * 0.5 + 0.5
fine = noise(N, 80, 320, (0.02, 1))
t = 0.35 * grain ** 3 + 0.4 * fine + 0.25 * noise(N, 3, 12, (0.2, 1))
pk = np.array([0.80, 0.64, 0.47]) * (1 - t[..., None] * 0.32) * tone[pl.astype(int)][..., None]
pk[butt] *= 0.55; save(pk, 'oak_planks_2k.jpg', 90)
rr = 0.38 + 0.18 * t; rr[butt] = 0.8; save(np.dstack([np.zeros_like(rr), rr, np.zeros_like(rr)]), 'oak_planks_mr_2k.jpg')
hh = t * 0.4; hh[butt] = -1.2; save(normal_from(hh, 3.0), 'oak_planks_n_2k.jpg', 92)
# travertine (coffee table): warm beige with horizontal bands and pores
N = 1024; yy, xx = np.mgrid[0:N, 0:N] / N
band = noise(N, 1, 6, (0.03, 1)); pores = (noise(N, 120, 400, (0.25, 1)) > 0.82).astype(float)
tr = np.array([0.86, 0.80, 0.70]) * (0.92 + 0.12 * band[..., None]) * (1 - 0.18 * pores[..., None])
save(tr, 'travertine_1k.jpg'); save(normal_from(-pores * 0.8 + band * 0.2, 2.5), 'travertine_n_1k.jpg', 92)
# fine upholstery weave (normal only, tiles every 8 cm): reads as smooth fabric at a distance, a soft weave up close
N = 512; T = 48; u = np.arange(N)[None, :] / N * T; v = np.arange(N)[:, None] / N * T
h = np.where(((np.floor(u) + np.floor(v)) % 2) > 0.5, np.abs(np.sin(u * np.pi)), np.abs(np.sin(v * np.pi))) * (0.8 + 0.4 * noise(N, 1, 8))
save(normal_from(h, 1.2), 'weave_n_512.jpg', 92)
# --- v3.6 materials pass: exterior brick, stacked ledgestone, matte plaster, concrete pavers; interior ceramic, granite, laminate, brushed steel ---
def mr_img(r): return np.dstack([np.zeros_like(r), r, np.zeros_like(r)])
rng3 = np.random.default_rng(11)
# exposed brick, stretcher bond: 230 x 70 mm bricks, 10 mm joints -> 4 bricks x 12 courses in a 0.96 m tile (1024 px)
N = 1024; px = N / 0.96; yy, xx = np.mgrid[0:N, 0:N]
course = (yy / (0.08 * px)).astype(int); off = (course % 2) * 0.12 * px; bx = ((xx + off) / (0.24 * px)).astype(int) % 4
ux = ((xx + off) % (0.24 * px)) / px; uy = (yy % (0.08 * px)) / px
mort = (ux < 0.01) | (uy < 0.01)
tone = rng3.random((12, 4)); tb = tone[course % 12, bx]
base = np.array([0.62, 0.33, 0.22]) * (0.82 + 0.3 * tb[..., None]) * (0.9 + 0.12 * noise(N, 20, 90)[..., None]) * (0.92 + 0.1 * noise(N, 2, 8)[..., None])
burnt = (tb > 0.85)[..., None]; base = np.where(burnt, base * 0.72, base)
base[mort] = (np.array([0.70, 0.67, 0.62]) * (0.9 + 0.1 * noise(N, 60, 200)[..., None]))[mort]
save(base, 'brick_1k.jpg'); r = np.where(mort, 0.95, 0.82 + 0.1 * noise(N, 40, 160)); save(mr_img(r), 'brick_mr_1k.jpg')
edge = np.minimum.reduce([ux - 0.01, uy - 0.01, 0.24 - ux, 0.08 - uy]) * px
hgt = np.clip(edge / 3.0, 0, 1) * 0.8 + noise(N, 60, 240) * 0.25; hgt[mort] = -0.4 + noise(N, 100, 300)[mort] * 0.1
save(normal_from(hgt, 2.2), 'brick_n_1k.jpg', 92)
# stacked ledgestone (split-face), 1.2 m tile at 2K: courses 35-95 mm, stones 150-600 mm, recessed dark joints
N = 2048; px = N / 1.2; img = np.zeros((N, N, 3)); hh = np.zeros((N, N)); y = 0; tones = [np.array(c) for c in ([0.60, 0.56, 0.50], [0.55, 0.53, 0.50], [0.64, 0.59, 0.52], [0.52, 0.48, 0.43], [0.58, 0.52, 0.45])]
grain = noise(N, 80, 400); split = noise(N, 20, 90, (0.3, 1))
while y < N:
    ch = int(rng3.uniform(0.035, 0.095) * px); ch = min(ch, N - y); x = int(rng3.uniform(0, 0.3) * px) - int(0.3 * px)
    while x < N:
        L = int(rng3.uniform(0.15, 0.6) * px); x0, x1 = max(0, x), min(N, x + L); gap = 3
        if x1 - x0 > gap * 2 and ch > gap * 2:
            t = tones[rng3.integers(0, len(tones))] * rng3.uniform(0.92, 1.06)
            sl = (slice(y + gap, y + ch - gap), slice(x0 + gap, x1 - gap)); img[sl] = t
            ys, xs = np.mgrid[y + gap:y + ch - gap, x0 + gap:x1 - gap]
            dome = np.minimum((ys - y) / ch, 1 - (ys - y) / ch) * 2; hh[sl] = 0.5 + 0.35 * np.clip(dome, 0, 1) ** 0.5 + rng3.uniform(-0.15, 0.15)
        x += L
    y += ch
joint = hh == 0
img = img * (0.8 + 0.3 * grain[..., None]) * (0.86 + 0.24 * split[..., None]); img[joint] = [0.2, 0.19, 0.17]
hh = hh + split * 0.45 + grain * 0.2; hh[joint] = -0.35
save(img, 'ledgestone_2k.jpg', 88); save(mr_img(np.where(joint, 0.95, 0.8 + 0.12 * grain)), 'ledgestone_mr_2k.jpg'); save(normal_from(hh, 3.0), 'ledgestone_n_2k.jpg', 90)
# fine matte exterior plaster: near-neutral albedo with soft mottling (tinted by the paint colour at runtime), sand-float normal, 2 m tile
N = 1024; mott = noise(N, 1, 4) * 0.6 + noise(N, 4, 16) * 0.4; sand = noise(N, 200, 500)
pl = np.ones((N, N, 3)) * (0.9 + 0.06 * (mott[..., None] - 0.5) + 0.03 * (sand[..., None] - 0.5)); save(pl, 'plaster_1k.jpg', 90)
save(normal_from(sand * 0.6 + noise(N, 30, 120) * 0.4, 1.4), 'plaster_n_1k.jpg', 92)
# concrete pavers 300 x 150 mm, running bond, 4 mm chamfered joints, piece-to-piece tone: 1.2 m tile (4 x 8)
N = 1024; px = N / 1.2; yy, xx = np.mgrid[0:N, 0:N]; row = (yy / (0.15 * px)).astype(int); off = (row % 2) * 0.15 * px
col = ((xx + off) / (0.3 * px)).astype(int) % 4; ux = ((xx + off) % (0.3 * px)) / px; uy = (yy % (0.15 * px)) / px
e = np.minimum.reduce([ux, uy, 0.3 - ux, 0.15 - uy]) * px; jt = e < 2.0; tn = rng3.random((8, 4))[row % 8, col]
pv = np.array([0.66, 0.64, 0.60]) * (0.88 + 0.2 * tn[..., None]) * (0.92 + 0.1 * noise(N, 40, 200)[..., None]); pv[jt] = [0.3, 0.29, 0.27]
save(pv, 'pavers_1k.jpg'); save(mr_img(np.where(jt, 0.95, 0.78 + 0.1 * noise(N, 30, 120))), 'pavers_mr_1k.jpg')
save(normal_from(np.clip(e / 5, 0, 1) * 0.7 + noise(N, 80, 300) * 0.2, 2.5), 'pavers_n_1k.jpg', 92)
# matte ceramic floor tile (no veining, faint speckle), 2 x 2 tiles per texture, 3 mm grout at 0.3 m tiles
N = 1024; yy, xx = np.mgrid[0:N, 0:N] / N; tx, ty = (xx * 2) % 1, (yy * 2) % 1
gr = (np.minimum.reduce([tx, 1 - tx, ty, 1 - ty]) * 512 < 2.6); spk = noise(N, 150, 500)
ce = np.ones((N, N, 3)) * (0.9 + 0.05 * (spk[..., None] - 0.5) + 0.02 * (noise(N, 2, 8)[..., None] - 0.5)); ce[gr] = [0.62, 0.6, 0.57]
save(ce, 'ceramic_1k.jpg'); rr = np.where(gr, 0.9, 0.55 + 0.08 * spk); save(mr_img(rr), 'ceramic_mr_1k.jpg')
gh = np.where(gr, -1.0, 0.0) + spk * 0.15; save(normal_from(gh, 3.0), 'ceramic_n_1k.jpg', 92)
# polished granite: neutral salt-and-pepper grains (tinted at runtime), 0.6 m tile
N = 1024; g1 = noise(N, 120, 420); g2 = noise(N, 40, 160)
gn = np.ones((N, N, 3)) * 0.55; gn[g1 > 0.62] = 0.15; gn[g1 < 0.3] = 0.85; gn *= (0.9 + 0.2 * g2[..., None]); save(gn, 'granite_1k.jpg')
# wood laminate (cabinet doors): straight, fine grain along x, 0.8 m tile
N = 1024; yy, xx = np.mgrid[0:N, 0:N] / N; w = noise(N, 1, 3, (0.04, 1))
lg = np.sin((yy * 60 + w * 4) * np.pi * 2) * 0.5 + 0.5; fl = noise(N, 100, 400, (0.02, 1))
la = np.array([0.78, 0.62, 0.45]) * (1 - (0.25 * lg ** 4 + 0.18 * fl)[..., None]); save(la, 'laminate_1k.jpg')
save(normal_from(lg ** 4 * 0.3 + fl * 0.4, 1.5), 'laminate_n_1k.jpg', 92)
# brushed steel: fine streaks along x
N = 512; st = noise(N, 1, 200, (0.004, 1)); save(normal_from(st, 2.0), 'brushed_n_512.jpg', 92)

# polished vitrified tile: soft cloudy body, no marble veining, fine grout (2 x 2 tiles per texture)
N = 2048; yy, xx = np.mgrid[0:N, 0:N] / N; tx, ty = (xx * 2) % 1, (yy * 2) % 1
cl = noise(N, 2, 10) * 0.6 + noise(N, 10, 40) * 0.4; gr = (np.minimum.reduce([tx, 1 - tx, ty, 1 - ty]) * 1024 < 1.8)
vt = np.ones((N, N, 3)) * (0.91 + 0.05 * (cl[..., None] - 0.5)) * np.array([1.0, 0.995, 0.985]); vt[gr] = [0.66, 0.64, 0.6]
save(vt, 'vitrified_2k.jpg', 90); save(mr_img(np.where(gr, 0.8, 0.14 + 0.04 * cl)), 'vitrified_mr_2k.jpg')
# --- v3.7 site: mown lawn (2.5 m tile) and asphalt (3 m tile)
N = 2048; rng4 = np.random.default_rng(21)
cl = noise(N, 3, 14); fine = noise(N, 180, 700); mid = noise(N, 30, 120); soil = (noise(N, 60, 260) > 0.83) & (cl < 0.35)
g0, g1, g2 = np.array([0.20, 0.32, 0.11]), np.array([0.30, 0.42, 0.15]), np.array([0.40, 0.46, 0.22])
t = (0.55 * fine + 0.3 * mid + 0.15 * cl)[..., None]
gr = g0 * (1 - t) + g1 * t; dry = (cl[..., None] > 0.62) * (cl[..., None] - 0.62) * 1.6; gr = gr * (1 - dry) + g2 * dry
gr[soil] = gr[soil] * 0.5 + np.array([0.33, 0.27, 0.19]) * 0.5
save(gr, 'grass_2k.jpg', 88); save(normal_from(fine * 0.7 + mid * 0.3, 2.0)[::2, ::2], 'grass_n_1k.jpg', 90)
N = 1024; agg = noise(N, 200, 500); patch = noise(N, 2, 10)
asp = np.ones((N, N, 3)) * (0.24 + 0.05 * (agg[..., None] - 0.5) + 0.03 * (patch[..., None] - 0.5)); asp[agg > 0.8] *= 1.35
save(asp, 'asphalt_1k.jpg'); save(normal_from(agg, 1.5), 'asphalt_n_1k.jpg', 90)
# --- v3.8 lawn: drawn blade by blade (top-down), 1.2 m tile at 2K so single blades read at eye level -----------------
from PIL import ImageDraw
def grass_tile(N=2048, tile=1.2, seed=5):
    r = np.random.default_rng(seed); px = N / tile
    alb = Image.new('RGB', (N, N), (58, 46, 30)); hgt = Image.new('L', (N, N), 0)
    da, dh = ImageDraw.Draw(alb), ImageDraw.Draw(hgt)
    soil = (noise(N, 20, 90) * 255).astype(np.uint8)
    base = np.array(alb).astype(float); s = soil[..., None] / 255.0
    base = base * (0.75 + 0.5 * s); alb = Image.fromarray(base.clip(0, 255).astype(np.uint8)); da = ImageDraw.Draw(alb)
    layers = 6; per = 13000
    for L in range(layers):
        depth = (L + 1) / layers                                          # later layers sit on top: lighter, higher
        for _ in range(per):
            x, y = r.uniform(0, N), r.uniform(0, N); ang = r.uniform(0, np.pi * 2); ln = r.uniform(0.018, 0.055) * px; w = max(2, int(r.uniform(0.0018, 0.0032) * px))
            dry = r.random() < 0.022; hue = r.normal(0, 1)
            g = np.array([0.24, 0.40, 0.12]) if not dry else np.array([0.40, 0.38, 0.20])
            g = g * (0.55 + 0.6 * depth) * (1 + 0.12 * hue) + np.array([0.04, 0.03, 0.0]) * r.random()
            c = tuple(int(v) for v in np.clip(g * 255, 0, 255)); hv = int(40 + 215 * depth * r.uniform(0.8, 1.0))
            x2, y2 = x + np.cos(ang) * ln, y + np.sin(ang) * ln
            for ox in (-N, 0, N):                                          # wrap so the tile is seamless
                for oy in (-N, 0, N):
                    if -ln < x + ox < N + ln and -ln < y + oy < N + ln:
                        da.line([(x + ox, y + oy), (x2 + ox, y2 + oy)], fill=c, width=w); dh.line([(x + ox, y + oy), (x2 + ox, y2 + oy)], fill=hv, width=max(1, w - 1))
    a = np.array(alb).astype(float) / 255.0; h = np.array(hgt).astype(float) / 255.0
    return a, h
ga, gh = grass_tile()
save(ga, 'lawn_2k.jpg', 90)
save(normal_from(gh, 3.5), 'lawn_n_2k.jpg', 84)
save(mr_img(0.92 - 0.25 * gh)[::2, ::2], 'lawn_mr_1k.jpg')
