import re, json, sys
f = sys.argv[1]
s = open('/tmp/po/' + f + '.html', encoding='utf8', errors='ignore').read()
m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', s, re.S)
if not m:
    print('---', f, 'senza NEXT_DATA'); sys.exit()
j = json.loads(m.group(1)); i = j['props']['pageProps'].get('initialData') or j['props']['pageProps']
t = json.dumps(i, ensure_ascii=False)
print('---', f, 'chiavi:', list(i.keys())[:12])
print('   byte', len(t), '| nomi giocatore:', len(re.findall(r'"(?:playerName|PlayerName|firstName|lastName)"', t)), '| formation/lineup:', len(re.findall(r'(?i)formation|lineup', t)), '| stat:', len(re.findall(r'(?i)shots|possession|corners', t)))
open('/tmp/po/' + f + '.json', 'w').write(t[:200000])
