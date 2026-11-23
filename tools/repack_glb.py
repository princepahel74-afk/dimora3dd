"""Re-encode the images inside a GLB at a smaller size (web-ready) and drop unused images/extensions.
usage: python3 -I repack_glb.py in.glb out.glb maxsize [drop_image_idx,...]"""
import sys, json, struct, io
from PIL import Image
src, dst, mx = sys.argv[1], sys.argv[2], int(sys.argv[3]); drop = set(int(x) for x in sys.argv[4].split(',')) if len(sys.argv) > 4 and sys.argv[4] else set()
b = open(src, 'rb').read(); jl = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + jl]); bo = 20 + jl + 8
blob = lambda bv: b[bo + bv.get('byteOffset', 0): bo + bv.get('byteOffset', 0) + bv['byteLength']]
views = []  # new data per bufferView
img_of_view = {i['bufferView']: k for k, i in enumerate(j['images'])}
for vi, bv in enumerate(j['bufferViews']):
    data = blob(bv)
    if vi in img_of_view:
        k = img_of_view[vi]
        if k in drop: data = b''
        else:
            im = Image.open(io.BytesIO(data)); im.load()
            if max(im.size) > mx: im = im.resize((mx, mx * im.size[1] // im.size[0]), Image.LANCZOS)
            out = io.BytesIO()
            if im.mode in ('RGBA', 'LA', 'P') and ('A' in im.mode or 'transparency' in im.info):
                im.convert('RGBA').save(out, 'PNG', optimize=True); j['images'][k]['mimeType'] = 'image/png'
            else:
                im.convert('RGB').save(out, 'JPEG', quality=88, optimize=True); j['images'][k]['mimeType'] = 'image/jpeg'
            data = out.getvalue()
    views.append(data)
buf = bytearray()
for vi, bv in enumerate(j['bufferViews']):
    while len(buf) % 4: buf.append(0)
    bv['byteOffset'] = len(buf); bv['byteLength'] = len(views[vi]); buf += views[vi]
while len(buf) % 4: buf.append(0)
j['buffers'] = [{'byteLength': len(buf)}]
js = json.dumps(j, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(buf)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(buf), 0x004E4942) + bytes(buf)
open(dst, 'wb').write(out); print(dst, len(out))
