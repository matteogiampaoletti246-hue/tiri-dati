# Secondo colore sociale di ogni squadra dell'archivio, letto dallo stemma (arch/colors2.json: id -> secondo colore).
# Il primo colore resta quello di colori.py (arch/colors.json). Qui si cerca la seconda zona di colore dello stemma
# che si distingue davvero dal primo; bianco e nero contano (bianco = #FFFFFF puro, mai grigio).
# Serve quando due squadre in campo hanno colori simili: la squadra in trasferta passa al secondo colore.
import json, io, os, sys, urllib.request, colorsys, concurrent.futures as cf
from PIL import Image

prim = json.load(open('arch/colors.json'))
out = {}
if os.path.exists('arch/colors2.json'):
    try: out = json.load(open('arch/colors2.json'))
    except Exception: out = {}
todo = [i for i in sorted(prim) if i not in out]
print(len(prim), 'squadre,', len(todo), 'da fare', flush=True)

def rgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
def dist(a, b):
    r = (a[0] + b[0]) / 2
    return ((2 + r / 256) * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + (2 + (255 - r) / 256) * (a[2] - b[2]) ** 2) ** .5

def second(i):
    try:
        req = urllib.request.Request(f'https://images.fotmob.com/image_resources/logo/teamlogo/{i}.png', headers={'User-Agent': 'Mozilla/5.0'})
        im = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=20).read())).convert('RGBA').resize((48, 48))
    except Exception:
        return i, None
    bins, tot = {}, 0
    for r, g, b, a in im.getdata():
        if a < 200: continue
        tot += 1
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if v < .2: key = 'nero'
        elif s < .18 and v > .78: key = 'bianco'
        elif s < .18: key = 'grigio'
        else: key = (int(h * 24), int(s * 3), int(v * 3))
        e = bins.setdefault(key, [0, 0, 0, 0]); e[0] += 1; e[1] += r; e[2] += g; e[3] += b
    if not tot: return i, None
    def col(k, e):
        n, r, g, b = e
        if k == 'bianco': return (255, 255, 255)
        if k == 'nero': return (17, 17, 17)
        h, s_, v = colorsys.rgb_to_hsv(r / n / 255, g / n / 255, b / n / 255)
        return tuple(x * 255 for x in colorsys.hsv_to_rgb(h, max(s_, .55), min(.95, max(.5, v))))
    # zone vicine dello stesso colore insieme (es. due rossi dello stemma)
    groups = []
    for k, e in sorted(bins.items(), key=lambda x: -x[1][0]):
        if k == 'grigio': continue
        c = col(k, e)
        for gr in groups:
            if dist(gr[1], c) < 110 and (k in ('bianco', 'nero')) == gr[2]:
                gr[0] += e[0]; break
        else: groups.append([e[0], c, k in ('bianco', 'nero')])
    groups.sort(key=lambda g: -g[0])
    colored = [g for g in groups if not g[2] and g[0] >= tot * .1]
    # primo colore: la zona colorata piu' grande se copre almeno il 10% dello stemma, altrimenti bianco/nero dominante
    # il primo colore resta quello di colori.py (arch/colors.json): qui solo il secondo, ben diverso dal primo
    p = rgb(prim[i])
    best = next((g[1] for g in groups if g[0] >= tot * .06 and dist(g[1], p) >= 200), None)
    if best is None:
        best = (17, 17, 17) if (p[0] * 299 + p[1] * 587 + p[2] * 114) / 1000 > 190 else (255, 255, 255)
    hx = lambda c: '#%02X%02X%02X' % tuple(int(round(x)) for x in c)
    return i, hx(best)

with cf.ThreadPoolExecutor(16) as ex:
    for n, (i, c) in enumerate(ex.map(second, todo)):
        if c: out[i] = c
        if n % 1000 == 0: print(n, flush=True)
json.dump(out, open('arch/colors2.json', 'w'), separators=(',', ':'), sort_keys=True)
print('ok', len(out))
