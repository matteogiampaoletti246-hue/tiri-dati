import re, json, sys
f = sys.argv[1]
s = open('/tmp/po/' + f + '.html', encoding='utf8', errors='ignore').read()
m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', s, re.S)
if not m:
    print('---', f, 'senza NEXT_DATA, byte', len(s)); sys.exit()
t = m.group(1)
print('---', f, 'NEXT_DATA byte', len(t), '| player:', len(re.findall(r'(?i)"player', t)), '| squad:', len(re.findall(r'(?i)squad|roster', t)), '| position:', len(re.findall(r'(?i)goalkeeper|defender|midfielder|forward|attacker', t)), '| img:', len(re.findall(r'(?i)\.(png|jpg|webp)', t)))
open('/tmp/po/' + f + '.json', 'w').write(t[:300000])
for u in sorted(set(re.findall(r'https?://onefootball[^"\\\s<]*(?:team|club)[^"\\\s<]*', s)))[:8]: print('   link', u)
for u in sorted(set(re.findall(r'"(/en/team/[^"\\]+)"', s)))[:8]: print('   link', u)
