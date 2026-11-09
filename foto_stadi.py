"""Foto degli stadi (aurora-src/stadi/): sempre dall'INTERNO (campo e tribune) quando su Wikimedia Commons ne esiste una
con licenza libera; solo se non c'e' si usa l'esterno; se lo stadio non si trova con certezza niente foto (foto sbagliata = meglio nessuna).

Stadi controllati: tutti quelli gia' in stadi/mappa.json (squadre di club) + quelli usati dalle NAZIONALI (Nations League,
qualificazioni, Mondiale, Europeo, Coppa d'Africa/Asia, Gold Cup, amichevoli...: partite/<fm>/ dal 2023).

Come sceglie: Wikidata (stadio verificato per nome e paese) -> categoria Commons (+ sottocategorie "interior", "matches at"...)
-> fino a 24 foto orizzontali con licenza libera -> CLIP (modello immagine/testo) da' a ogni foto la probabilita' "interno con campo
e tribune" contro "esterno / aereo / altro". Vince l'interno migliore; senza interni, l'esterno migliore.
Scelte manuali in stadi_scelte.json: {"Nome stadio": "File:...jpg"} oppure {"Nome stadio": null} (nessuna foto).

Uscite: aurora-src/stadi/*.webp (1100x540), mappa.json, crediti.json, src/data/creditiStadi.js,
report/stadi/candidati.json (cache dei punteggi) e report/stadi/foglio_XX.jpg (provini per il controllo a occhio)."""
import concurrent.futures as cf, difflib, glob, gzip, io, json, os, re, sys, time, unicodedata, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
SDIR = os.path.join(ROOT, 'aurora-src', 'stadi')
RDIR = os.path.join(ROOT, 'report', 'stadi')
os.makedirs(RDIR, exist_ok=True)
UA = 'ScalperLab-stadium-photos/1.0 (personal project; https://github.com/matteogiampaoletti246-hue/tiri-dati)'
WD = 'https://www.wikidata.org/w/api.php'
CM = 'https://commons.wikimedia.org/w/api.php'
EN = 'https://en.wikipedia.org/w/api.php'
NAT = [289, 9428, 290, 298, 9821, 44, 50, 10242, 10304, 329, 9876, 9806, 9807, 9808, 9809, 77, 10195, 10201, 10608, 10609, 114]
TOURN = {289, 9428, 290, 298, 44, 50, 10242, 10304, 329, 9876, 77}  # fasi finali in campo neutro
STADIUM_P31 = {'Q483110', 'Q1154710', 'Q1076486', 'Q641226', 'Q2310214', 'Q7579839', 'Q19428855', 'Q1371849', 'Q17350442'}
DESC_RE = re.compile(r'stadium|stadion|stadio|estadio|est[aá]dio|stade|arena|ground|venue|football|soccer|sport', re.I)
FREE_RE = re.compile(r'^(cc[ -]?by(-sa)?[ -]?[0-9.]+.*|cc0.*|public domain|pd.*|cc by(-sa)?.*)$', re.I)
NONFREE_RE = re.compile(r'\b(nc|nd)\b|non-?commercial|no ?deriv', re.I)
BAD_TITLE = re.compile(r'\bold stadium\b|the old\b|\bformer\b|\bhistoric(al)?\b|logo|map\b|mapa|karte|plan\b|diagram|ticket|badge|crest|wappen|escudo|sign\b|schild|plaque|statue|bust\b|memorial|'
                       r'museum|construction|bau(stelle|arbeiten)|demolition|abriss|jersey|shirt|trophy|poster|stamp|coin|\.svg$|\.gif$|\.tiff?$|\.pdf$|\.webm$|\.ogv$', re.I)
IN_HINT = re.compile(r'interior|inside|innen|intérieur|interno|pitch|field|feld|campo|cancha|terrain|tribun|stand|grada|panorama|'
                     r' vs\.? | v\.? |match|spiel|partido|partita|derby|fans|curva|kop\b|view from|vista', re.I)
OUT_HINT = re.compile(r'exterior|outside|au[sß]en|facade|fassade|fachada|entrance|eingang|gate|aerial|luftbild|drone|from above|street|stra[sß]e', re.I)
SUBCAT_HINT = re.compile(r'interior|inside|pitch|stands?\b|tribun|grandstand|matches|games|panoram|seating|innen|view', re.I)
GENERIC = {'national', 'olympic', 'olimpico', 'olimpiyskiy', 'municipal', 'central', 'city', 'nacional', 'national', 'stade', 'stadium',
           'stadio', 'estadio', 'estadio', 'stadion', 'arena', 'sports', 'complex', 'the', 'of', 'de', 'del', 'du', 'la', 'le', 'park', 'ground'}
ALIAS = {'england': 'united kingdom', 'scotland': 'united kingdom', 'wales': 'united kingdom', 'northern ireland': 'united kingdom',
         'republic of ireland': 'ireland', 'usa': 'united states', 'united states': 'united states', 'korea republic': 'south korea',
         'south korea': 'south korea', 'korea dpr': 'north korea', 'turkiye': 'turkey', 'turkey': 'turkey', 'czechia': 'czech republic',
         'czech republic': 'czech republic', 'cote d ivoire': 'ivory coast', 'ivory coast': 'ivory coast', 'dr congo': 'democratic republic of the congo',
         'congo dr': 'democratic republic of the congo', 'congo': 'republic of the congo', 'china pr': 'people s republic of china', 'china': 'people s republic of china',
         'chinese taipei': 'taiwan', 'cape verde': 'cape verde', 'cape verde islands': 'cape verde', 'curacao': 'kingdom of the netherlands',
         'aruba': 'kingdom of the netherlands', 'faroe islands': 'kingdom of denmark', 'greenland': 'kingdom of denmark', 'gibraltar': 'united kingdom',
         'bosnia herzegovina': 'bosnia and herzegovina', 'iran': 'iran', 'ir iran': 'iran', 'russia': 'russia', 'the gambia': 'the gambia', 'gambia': 'the gambia',
         'eswatini': 'eswatini', 'swaziland': 'eswatini', 'macedonia': 'north macedonia', 'kyrgyzstan': 'kyrgyzstan', 'vietnam': 'vietnam', 'syria': 'syria',
         'palestine': 'state of palestine', 'trinidad tobago': 'trinidad and tobago', 'st kitts and nevis': 'saint kitts and nevis',
         'st lucia': 'saint lucia', 'st vincent grenadines': 'saint vincent and the grenadines', 'antigua barbuda': 'antigua and barbuda',
         'puerto rico': 'united states', 'guam': 'united states', 'us virgin islands': 'united states', 'bermuda': 'united kingdom',
         'cayman islands': 'united kingdom', 'montserrat': 'united kingdom', 'anguilla': 'united kingdom', 'british virgin islands': 'united kingdom',
         'turks and caicos islands': 'united kingdom', 'martinique': 'france', 'guadeloupe': 'france', 'french guiana': 'france', 'new caledonia': 'france',
         'tahiti': 'france', 'reunion': 'france', 'hong kong': 'hong kong', 'macau': 'macau', 'kosovo': 'kosovo'}


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).lower()
    s = ''.join(c for c in s if not unicodedata.combining(c)).replace('ı', 'i').replace('ł', 'l').replace('ø', 'o').replace('ß', 'ss')
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def slug(s):
    return norm(s).replace(' ', '-')[:70] or 'stadio'


def http(url, params=None, raw=False, tries=6):
    if params:
        url = url + '?' + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=40)
            b = r.read()
            return b if raw else json.loads(b)
        except Exception as e:
            code = getattr(e, 'code', None)
            if code == 404:
                return None
            time.sleep(min(30, 2 ** i + (5 if code == 429 else 0)))
    return None


def api(base, **p):
    p.update(format='json', formatversion=2)
    return http(base, p) or {}


# ---------------------------------------------------------------- elenco degli stadi
mappa = json.load(open(os.path.join(SDIR, 'mappa.json'), encoding='utf-8'))
crediti = json.load(open(os.path.join(SDIR, 'crediti.json'), encoding='utf-8'))
try:
    scelte = json.load(open(os.path.join(ROOT, 'stadi_scelte.json'), encoding='utf-8'))
except Exception:
    scelte = {}
have = {norm(k): f for k, f in mappa.items()}
# Voce Wikipedia (inglese) fissata a mano per gli stadi che la ricerca per nome non trova o confonde.
VOCI = {'Stadion Feijenoord': 'De Kuip', 'Vitality Stadium': 'Dean Court', 'Estadio de Mendizorroza': 'Mendizorrotza Stadium',
        'Estadio La Cartuja de Sevilla': 'Estadio de La Cartuja', 'Turka Arac Muayene Kocaeli Stadyumu': 'Kocaeli Stadium',
        'Alphamega Stadium': 'Limassol Arena', 'Miami Stadium': 'Hard Rock Stadium', 'Arena Naţională': 'Arena Națională', 'Gaziantep Stadyumu': 'Gaziantep Stadium', 'Estádio da Madeira': 'Estádio da Madeira'}
# Foto da non usare mai (collage, modellini, piantine, selfie, foto storiche, muri...): si prende la migliore dopo.
try:
    scarta = set(json.load(open(os.path.join(ROOT, 'stadi_scarta.json'), encoding='utf-8')))
except Exception:
    scarta = set()

stadi = {}  # chiave = nome del file webp (senza estensione)
for f, c in crediti.items():
    stadi[f[:-5]] = {'name': c['stadio'], 'voce': c.get('voce'), 'file': f, 'keys': [k for k, v in mappa.items() if v == f],
                     'old': c.get('file'), 'teams': set(), 'comps': set()}
for s_ in stadi.values():
    if s_['name'] in VOCI:
        s_['voce'] = VOCI[s_['name']]

idx = json.load(open(os.path.join(ROOT, 'arch', 'index.json'), encoding='utf-8'))
nat = {}
for fm in NAT:
    for p in glob.glob(os.path.join(ROOT, 'partite', str(fm), '*.json.gz')):
        sk = os.path.basename(p)[:-8]
        if sk[:4] < '2023':
            continue
        try:
            det = json.load(gzip.open(p, 'rt', encoding='utf-8'))
        except Exception:
            continue
        try:
            teams = json.load(open(os.path.join(ROOT, 'arch', str(fm), sk + '.json'), encoding='utf-8')).get('teams') or {}
        except Exception:
            teams = {}
        for m in (det.get('m') or {}).values():
            st = ((m or {}).get('i') or {}).get('st')
            hid = str(((m or {}).get('h') or {}).get('id'))
            if not st:
                continue
            e = nat.setdefault(st, {'teams': set(), 'comps': set(), 'n': 0})
            e['n'] += 1
            e['comps'].add(fm)
            if teams.get(hid):
                e['teams'].add(teams[hid])
for st, e in nat.items():
    if norm(st) in have:
        continue  # stadio gia' con foto (es. Johan Cruijff ArenA): stessa foto anche per la nazionale
    k = slug(st)
    if k in stadi:
        stadi[k]['keys'].append(st)
        continue
    stadi[k] = {'name': st, 'voce': VOCI.get(st), 'file': k + '.webp', 'keys': [st], 'old': None, 'teams': e['teams'], 'comps': e['comps'], 'nat': True}
print(len(stadi), 'stadi da controllare,', sum(1 for s in stadi.values() if s.get('nat')), 'nuovi delle nazionali', flush=True)

# ---------------------------------------------------------------- cache dei candidati (secondo giro veloce)
CACHE = os.path.join(RDIR, 'candidati.json')
try:
    cache = json.load(open(CACHE, encoding='utf-8'))
except Exception:
    cache = {}

# ---------------------------------------------------------------- Wikidata
_ent = {}


def entities(ids):
    ids = [i for i in ids if i and i not in _ent]
    for i in range(0, len(ids), 40):
        d = api(WD, action='wbgetentities', ids='|'.join(ids[i:i + 40]), props='labels|aliases|descriptions|claims|sitelinks')
        for k, v in (d.get('entities') or {}).items():
            _ent[k] = v
    return _ent


def claim_ids(e, p):
    out = []
    for c in (e.get('claims') or {}).get(p, []):
        v = ((c.get('mainsnak') or {}).get('datavalue') or {}).get('value')
        if isinstance(v, dict) and v.get('id'):
            out.append(v['id'])
        elif isinstance(v, str):
            out.append(v)
    return out


def labels_of(e):
    out = set()
    for v in (e.get('labels') or {}).values():
        out.add(v['value'] if isinstance(v, dict) else v)
    for vs in (e.get('aliases') or {}).values():
        for v in vs:
            out.add(v['value'] if isinstance(v, dict) else v)
    return out


def en_label(e):
    l = (e.get('labels') or {}).get('en')
    return (l or {}).get('value') if isinstance(l, dict) else l


def is_stadium(e):
    if set(claim_ids(e, 'P31')) & STADIUM_P31:
        return True
    d = (e.get('descriptions') or {}).get('en')
    d = (d or {}).get('value', '') if isinstance(d, dict) else (d or '')
    return bool(DESC_RE.search(d))


def countries_of(e):
    cs = claim_ids(e, 'P17')
    entities(cs)
    return {norm(en_label(_ent.get(c, {})) or '') for c in cs}


def team_countries(s):
    out = set()
    for t in s.get('teams') or []:
        n = norm(t)
        out.add(ALIAS.get(n, n))
    return out


def sim(a, b):
    a, b = norm(a), norm(b)
    return difflib.SequenceMatcher(None, a, b).ratio() if a and b else 0


def generic(name):
    return len([w for w in norm(name).split() if w not in GENERIC]) <= 1


def resolve(s):
    """Elemento Wikidata dello stadio, verificato. None se non e' certo."""
    if s.get('voce') and not str(s['voce']).startswith('File:'):
        d = api(EN, action='query', titles=s['voce'], prop='pageprops', ppprop='wikibase_item', redirects=1)
        for p in (d.get('query') or {}).get('pages', []):
            q = (p.get('pageprops') or {}).get('wikibase_item')
            if q:
                return q
    name = s['name']
    tc = team_countries(s)
    tourn = bool(set(s.get('comps') or []) & TOURN)
    qs = []
    for q in [name, re.sub(r'\(.*?\)', '', name).strip()]:
        if q and q not in qs:
            qs.append(q)
    cand = []
    for q in qs:
        d = api(WD, action='wbsearchentities', search=q, language='en', limit=7, type='item')
        cand += [x['id'] for x in d.get('search') or []]
    d = api(EN, action='query', list='search', srsearch=name + ' stadium', srlimit=4)
    titles = [x['title'] for x in (d.get('query') or {}).get('search', [])]
    if titles:
        d = api(EN, action='query', titles='|'.join(titles), prop='pageprops', ppprop='wikibase_item', redirects=1)
        cand += [(p.get('pageprops') or {}).get('wikibase_item') for p in (d.get('query') or {}).get('pages', [])]
    cand = [c for i, c in enumerate(cand) if c and c not in cand[:i]]
    entities(cand)
    best, bs = None, 0
    for c in cand:
        e = _ent.get(c)
        if not e or not is_stadium(e):
            continue
        sm = max([sim(name, l) for l in labels_of(e)] + [0])
        cm = bool(countries_of(e) & tc) if tc else False
        ok = (sm >= 0.72 and cm) or (sm >= 0.9 and not generic(name) and (cm or tourn or not tc)) or (sm >= 0.97 and not generic(name))
        if ok and sm + (0.2 if cm else 0) > bs:
            best, bs = c, sm + (0.2 if cm else 0)
    return best


# ---------------------------------------------------------------- foto candidate
def cat_files(cat, limit=200):
    out = []
    d = api(CM, action='query', list='categorymembers', cmtitle='Category:' + cat, cmtype='file', cmlimit=limit)
    out += [x['title'] for x in (d.get('query') or {}).get('categorymembers', [])]
    return out


def imageinfo(titles, p18=(), pre=None, strict=True):
    info = []
    for i in range(0, len(titles), 50):
        d = api(CM, action='query', titles='|'.join(titles[i:i + 50]), prop='imageinfo', iiprop='url|size|mime|extmetadata|timestamp', iiurlwidth=330)
        for p in (d.get('query') or {}).get('pages', []):
            ii = (p.get('imageinfo') or [None])[0]
            if not ii or ii.get('mime') not in ('image/jpeg', 'image/png'):
                continue
            w, h = ii.get('width', 0), ii.get('height', 1)
            if strict and (w < 1100 or w / h < 1.25):
                continue
            md = ii.get('extmetadata') or {}
            lic = (md.get('LicenseShortName') or {}).get('value', '')
            if not FREE_RE.match(lic.strip()) or NONFREE_RE.search(lic):
                continue
            art = re.sub(r'<[^>]+>', '', (md.get('Artist') or {}).get('value', '')).strip() or 'Wikimedia Commons'
            info.append({'f': p['title'], 'w': w, 'h': h, 'thumb': ii.get('thumburl'), 'url': ii.get('url'), 'page': ii.get('descriptionurl'),
                         'lic': lic.strip(), 'licUrl': (md.get('LicenseUrl') or {}).get('value', ''), 'art': re.sub(r'\s+', ' ', art)[:120],
                         'ts': ii.get('timestamp', ''), 'p18': p['title'] in p18, 'pre': (pre or {}).get(p['title'], 0)})
    return info


def candidates(q):
    e = _ent.get(q) or entities([q]).get(q) or {}
    files = [('File:' + f if not f.startswith('File:') else f) for f in claim_ids(e, 'P18')]
    p18 = set(files)
    cats = claim_ids(e, 'P373')
    if not cats:
        sl = ((e.get('sitelinks') or {}).get('commonswiki') or {}).get('title', '')
        if sl.startswith('Category:'):
            cats = [sl[9:]]
    for cat in cats[:1]:
        files += cat_files(cat)
        todo, done = [(cat, 0)], {cat}
        while todo and len(done) < 14:  # sottocategorie "interior", "matches at", "stands"... e le loro (es. partite per anno)
            c0, lv = todo.pop(0)
            d = api(CM, action='query', list='categorymembers', cmtitle='Category:' + c0, cmtype='subcat', cmlimit=100)
            subs = [x['title'][9:] for x in (d.get('query') or {}).get('categorymembers', [])]
            subs = [x for x in subs if SUBCAT_HINT.search(x) or (lv > 0 and re.search(r'20[12]\d', x))]
            for sc in sorted(subs, key=lambda x: -int((re.findall(r'20[12]\d', x) or ['0'])[-1]))[:6]:
                if sc in done:
                    continue
                done.add(sc)
                files += cat_files(sc, 60)
                if lv < 1:
                    todo.append((sc, lv + 1))
    # ricerca libera su Commons col nome dello stadio (foto non messe in categoria): solo titoli che contengono una parola distintiva
    lab = en_label(e) or ''
    words = [w for w in norm(lab).split() if w not in GENERIC and len(w) > 2]
    if words:
        for qq in (lab + ' interior', lab + ' match', lab):
            d = api(CM, action='query', list='search', srsearch=qq, srnamespace=6, srlimit=40)
            for x in (d.get('query') or {}).get('search', []):
                if any(w in norm(x['title']) for w in words):
                    files.append(x['title'])
    seen, out = set(), []
    for f in files:
        if f in seen or BAD_TITLE.search(f):
            continue
        seen.add(f)
        yr = re.findall(r'(?<!\d)(19[5-9]\d|20[0-3]\d)(?!\d)', f)
        pre = (2 if IN_HINT.search(f) else 0) - (2 if OUT_HINT.search(f) else 0) + (1 if f in p18 else 0) + (1 if yr and int(yr[-1]) >= 2015 else 0) - (2 if yr and int(yr[-1]) < 2005 else 0)
        out.append((pre, f))
    out.sort(key=lambda x: -x[0])
    titles = [f for _, f in out[:110]]
    info = imageinfo(titles, p18, dict((f, x) for x, f in out), strict=True)
    info.sort(key=lambda x: -x['pre'])
    return info[:36], (en_label(e) or None)


# ---------------------------------------------------------------- CLIP
import torch, open_clip
from PIL import Image, ImageDraw, ImageFont

torch.set_num_threads(os.cpu_count() or 2)
model, _, prep = open_clip.create_model_and_transforms('ViT-B-32', pretrained='laion2b_s34b_b79k')
tok = open_clip.get_tokenizer('ViT-B-32')
model.eval()
P_IN = ['a photo taken inside a football stadium showing the green pitch and the stands',
        'a football match being played in a stadium, seen from the stands',
        'a wide view of the inside of a soccer stadium with rows of seats around the field']
P_EXT = ['the outside facade of a stadium building seen from the street',
         'an aerial view of a stadium from above',
         'the exterior of a sports arena with a car park in front']
P_NEG = ['a statue or a monument', 'a sign or a logo on a wall', 'a building site with cranes', 'a portrait of a group of people',
         'a map or a diagram', 'an indoor corridor or a room', 'a city street with houses', 'a ticket office or an entrance gate',
         'an indoor basketball or ice hockey arena', 'an athletics running track with no football',
         'an old black and white photograph', 'a close-up of football players on the pitch', 'a team celebrating with a trophy',
         'a close-up of stadium seats', 'a toy model or a miniature of a stadium', 'a concert stage inside a stadium',
         'a collage of two photos one above the other', 'a person posing for a photo', 'a close-up of fans in the crowd',
         'a ceremony with performers on the pitch seen from above', 'a seating plan or a printed map of a stadium',
         'a selfie of two people', 'a lego or cardboard model', 'a wall with painted letters']
with torch.no_grad():
    TXT = model.encode_text(tok(P_IN + P_EXT + P_NEG))
    TXT /= TXT.norm(dim=-1, keepdim=True)


EMBF = os.path.join(RDIR, 'emb.npz')
import numpy as np
try:
    _z = np.load(EMBF)
    EMB = {k: _z[k] for k in _z.files}
except Exception:
    EMB = {}


def embed(imgs):
    with torch.no_grad():
        x = torch.stack([prep(im.convert('RGB')) for im in imgs])
        f = model.encode_image(x)
        f /= f.norm(dim=-1, keepdim=True)
    return [v.numpy().astype('float16') for v in f]


def probs(v):
    t = torch.from_numpy(v.astype('float32'))
    pr = (100 * t @ TXT.T).softmax(dim=-1)
    a, b = len(P_IN), len(P_IN) + len(P_EXT)
    return round(float(pr[:a].sum()), 3), round(float(pr[a:b].sum()), 3)


def clip_scores(imgs):
    return [probs(v) for v in embed(imgs)]


def fetch_img(url):
    b = http(url, raw=True)
    try:
        return Image.open(io.BytesIO(b)) if b else None
    except Exception:
        return None


def score_cands(cands):
    need = [c for c in cands if c['f'] not in EMB]
    with cf.ThreadPoolExecutor(4) as ex:
        imgs = list(ex.map(lambda c: fetch_img(c['thumb']), need))
    ok = [(c, im) for c, im in zip(need, imgs) if im is not None]
    for i in range(0, len(ok), 32):
        part = ok[i:i + 32]
        for (c, _), v in zip(part, embed([im for _, im in part])):
            EMB[c['f']] = v
    out = []
    for c in cands:
        if c['f'] in EMB:
            c['in'], c['ext'] = probs(EMB[c['f']])
            out.append(c)
    return out


def pick(cands):
    cands = [c for c in cands if c['f'] not in scarta]
    def rank_in(c):  # anno nel titolo prima del 2005 = stadio com'era (spesso demolito o rifatto): in fondo
        yr = re.findall(r'(?<!\d)(1[89]\d\d|200[0-4])(?!\d)', c['f'])
        return c['in'] + (0.04 if c['ts'][:4] >= '2018' else 0) + (0.02 if c['w'] >= 2000 else 0) - (0.5 if yr else 0)
    ins = [c for c in cands if c['in'] >= 0.55]
    if ins:
        return max(ins, key=rank_in), 'interno'
    exts = [c for c in cands if c['in'] + c['ext'] >= 0.6]
    if exts:
        return max(exts, key=lambda c: c['in'] + c['ext'] + (0.15 if c['p18'] else 0)), 'esterno'
    return None, None


# ---------------------------------------------------------------- giro su tutti gli stadi
t0 = time.time()
for n, (k, s) in enumerate(sorted(stadi.items())):
    entry = cache.get(k)
    if not entry or entry.get('v', 0) < 4 or (s['name'] in VOCI and entry.get('voce') != VOCI[s['name']]):
        q = resolve(s)
        entry = {'v': 4, 'q': q, 'voce': s.get('voce'), 'name': s['name'], 'cands': [], 'label': None}
        if q:
            entry['cands'], entry['label'] = candidates(q)
    entry['cands'] = score_cands(entry.get('cands') or [])
    if s.get('old'):  # foto attuale: punteggio per il confronto
        p = os.path.join(SDIR, s['file'])
        if 'cur:' + k not in EMB and os.path.exists(p):
            EMB['cur:' + k] = embed([Image.open(p)])[0]
        if 'cur:' + k in EMB:
            entry['cur'] = probs(EMB['cur:' + k])
    cache[k] = entry
    if n % 25 == 0:
        json.dump(cache, open(CACHE, 'w', encoding='utf-8'), ensure_ascii=False)
        np.savez_compressed(EMBF, **EMB)
        print(n, len(stadi), k, entry.get('q'), len(entry['cands']), int(time.time() - t0), 's', flush=True)
json.dump(cache, open(CACHE, 'w', encoding='utf-8'), ensure_ascii=False)
np.savez_compressed(EMBF, **EMB)

# ---------------------------------------------------------------- scelta e foto finali
def final_image(c):
    url = c['url'] if c['w'] <= 1280 else re.sub(r'/\d+px-', '/1280px-', c['thumb'])
    im = fetch_img(url) or fetch_img(c['url'])
    if im is None:
        return None
    im = im.convert('RGB')
    W, H = 1100, 540
    r = max(W / im.width, H / im.height)
    im = im.resize((max(W, round(im.width * r)), max(H, round(im.height * r))), Image.LANCZOS)
    x, y = (im.width - W) // 2, int((im.height - H) * 0.5)
    return im.crop((x, y, x + W, y + H))


changes, review = [], []
qfile = {cache[k]['q']: s['file'] for k, s in stadi.items() if s.get('old') and (cache.get(k) or {}).get('q')}
for k, s in sorted(stadi.items()):
    e = cache.get(k) or {}
    cands = e.get('cands') or []
    force = None
    for key in [s['name']] + s['keys']:
        if key in scelte:
            force = ('set', scelte[key])
    if force and force[1] is None:
        choice, kind = None, 'tolta'
    elif force:
        choice = next((c for c in cands if c['f'] == force[1]), None)
        if not choice:
            choice = (score_cands(imageinfo([force[1]], strict=False)) or [None])[0]
        kind = 'scelta a mano'
    else:
        choice, kind = pick(cands)
    cur = e.get('cur')
    if s.get('old') and not force:
        cur_in = 0 if s['old'] in scarta else (cur[0] if cur else 0)
        better = choice and (kind == 'interno' or s['old'] in scarta) and choice['f'] != s['old'] and (cur_in < 0.55 or choice['in'] >= cur_in + 0.25)
        if not better and s['old'] in scarta:  # foto attuale sbagliata e nessuna alternativa buona: meglio nessuna foto
            choice, force = None, ('set', None)
        elif not better:
            review.append({'k': k, 'name': s['name'], 'kind': 'invariata', 'in': cur_in, 'file': s['file']})
            continue
    if s.get('nat') and e.get('q') in qfile and not force:  # stesso stadio gia' con foto sotto un altro nome
        for kk in s['keys']:
            mappa[kk] = qfile[e['q']]
        changes.append((k, 'stesso stadio'))
        continue
    path = os.path.join(SDIR, s['file'])
    if not choice:
        if s.get('old') and force:  # tolta a mano
            if os.path.exists(path):
                os.remove(path)
            crediti.pop(s['file'], None)
            for kk in s['keys']:
                mappa.pop(kk, None)
            changes.append((k, 'tolta'))
        continue
    im = final_image(choice)
    if im is None:
        continue
    im.save(path, 'WEBP', quality=72, method=6)
    crediti[s['file']] = {'stadio': s['name'], 'voce': e.get('label') or s.get('voce') or s['name'], 'file': choice['f'], 'autore': choice['art'],
                          'licenza': choice['lic'], 'licenzaUrl': choice['licUrl'], 'fonte': choice['page']}
    for kk in s['keys']:
        mappa[kk] = s['file']
    changes.append((k, kind))
    if s.get('nat') and e.get('q'):
        qfile.setdefault(e['q'], s['file'])
    review.append({'k': k, 'name': s['name'], 'kind': ('nuova ' if s.get('nat') else 'cambiata ') + kind, 'in': choice['in'], 'file': s['file']})

json.dump(dict(sorted(mappa.items(), key=lambda x: x[0].lower())), open(os.path.join(SDIR, 'mappa.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(dict(sorted(crediti.items())), open(os.path.join(SDIR, 'crediti.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
txt = '; '.join(f"{c['voce']}: {c['autore']} ({c['licenza']})" for c in sorted(crediti.values(), key=lambda c: norm(c['voce'])))
open(os.path.join(ROOT, 'aurora-src', 'src', 'data', 'creditiStadi.js'), 'w', encoding='utf-8').write(
    '// Crediti delle foto degli stadi (Wikimedia Commons), mostrati in Linee guida. Generato da stadi/crediti.json.\nexport default '
    + json.dumps(txt, ensure_ascii=False) + ';\n')

# ---------------------------------------------------------------- provini per il controllo a occhio (solo foto nuove o cambiate + esterni)
for f in glob.glob(os.path.join(RDIR, 'foglio_*.jpg')):
    os.remove(f)
show = [r for r in review if r['kind'] != 'invariata'] + [r for r in review if r['kind'] == 'invariata']
font = ImageFont.load_default()
TW, TH, COLS, ROWS = 330, 162, 4, 6
for i in range(0, len(show), COLS * ROWS):
    sheet = Image.new('RGB', (COLS * TW, ROWS * (TH + 30)), (20, 20, 24))
    dr = ImageDraw.Draw(sheet)
    for j, r in enumerate(show[i:i + COLS * ROWS]):
        p = os.path.join(SDIR, r['file'])
        if not os.path.exists(p):
            continue
        x, y = (j % COLS) * TW, (j // COLS) * (TH + 30)
        sheet.paste(Image.open(p).convert('RGB').resize((TW - 6, TH)), (x + 3, y))
        dr.text((x + 4, y + TH + 2), f"{i + j} {r['name'][:38]}", fill=(255, 255, 255), font=font)
        dr.text((x + 4, y + TH + 15), f"{r['kind']} in={r['in']}", fill=(150, 200, 255), font=font)
    sheet.save(os.path.join(RDIR, f'foglio_{i // (COLS * ROWS):02d}.jpg'), quality=80)
# alternative per gli stadi indicati in stadi_alternative.json (per scegliere a mano)
try:
    altn = json.load(open(os.path.join(ROOT, 'stadi_alternative.json'), encoding='utf-8'))
except Exception:
    altn = []
for f in glob.glob(os.path.join(RDIR, 'alt_*.jpg')):
    os.remove(f)
alts, rows = {}, []
for name in altn:
    k = next((kk for kk, s in stadi.items() if s['name'] == name or name in s['keys']), None)
    cands = sorted((cache.get(k) or {}).get('cands') or [], key=lambda c: -c['in'])[:8]
    alts[name] = [c['f'] for c in cands]
    rows.append((name, cands))
AW, AH = 220, 124
for i in range(0, len(rows), 8):
    sheet = Image.new('RGB', (8 * AW, 8 * (AH + 16)), (20, 20, 24))
    dr = ImageDraw.Draw(sheet)
    for r, (name, cands) in enumerate(rows[i:i + 8]):
        y = r * (AH + 16)
        with cf.ThreadPoolExecutor(4) as ex:
            ims = list(ex.map(lambda c: fetch_img(c['thumb']), cands))
        for j, (c, im) in enumerate(zip(cands, ims)):
            if im is not None:
                sheet.paste(im.convert('RGB').resize((AW - 4, AH)), (j * AW + 2, y))
            dr.text((j * AW + 3, y + AH + 2), f"{name[:20]} #{j} in={c['in']}", fill=(255, 255, 255), font=font)
    sheet.save(os.path.join(RDIR, f'alt_{i // 8:02d}.jpg'), quality=80)
json.dump(alts, open(os.path.join(RDIR, 'alternative.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(show, open(os.path.join(RDIR, 'revisione.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('modifiche:', len(changes), {k: sum(1 for _, x in changes if x == k) for k in set(x for _, x in changes)})
print('foto totali:', len(crediti))
