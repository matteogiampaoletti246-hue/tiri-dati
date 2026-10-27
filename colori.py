# Colori sociali di ogni squadra dell'archivio: colore dominante (saturo) dello stemma.
import json, glob, io, os, urllib.request, concurrent.futures as cf
from PIL import Image
ids = set()
for f in glob.glob('arch/*/*.json'):
    if f.endswith('_s.json'): continue
    try: j = json.load(open(f))
    except Exception: continue
    for k in (j.get('teams') or {}): ids.add(str(k))
out = {}
if os.path.exists('arch/colors.json'):
    try: out = json.load(open('arch/colors.json'))
    except Exception: out = {}
todo = [i for i in sorted(ids) if i not in out]
print(len(ids), 'squadre,', len(todo), 'da fare')
def dom(i):
    try:
        req = urllib.request.Request(f'https://images.fotmob.com/image_resources/logo/teamlogo/{i}.png', headers={'User-Agent': 'Mozilla/5.0'})
        im = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=20).read())).convert('RGBA').resize((48, 48))
    except Exception:
        return i, None
    import colorsys
    bins = {}
    for r, g, b, a in im.getdata():
        if a < 200: continue
        h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
        if v < .18 or (s < .22 and v > .75): continue   # niente nero/bianco/grigi
        key = (int(h*24), int(s*3), int(v*3))
        w = (s + .2) * (0.6 + v)
        bins[key] = bins.get(key, 0) + w
    if not bins: return i, '#5A6B8C'
    k = max(bins, key=bins.get)
    h = (k[0] + .5) / 24; s = min(1, (k[1] + 1.2) / 3); v = min(.95, max(.55, (k[2] + 1.2) / 3))
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return i, '#%02X%02X%02X' % (int(r*255), int(g*255), int(b*255))
with cf.ThreadPoolExecutor(12) as ex:
    for n, (i, c) in enumerate(ex.map(dom, todo)):
        if c: out[i] = c
        if n % 500 == 0: print(n, flush=True)
json.dump(out, open('arch/colors.json', 'w'), separators=(',', ':'))
print('ok', len(out))
