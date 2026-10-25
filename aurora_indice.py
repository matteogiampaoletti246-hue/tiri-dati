"""Indice leggero per l'app Aurora.

Legge i file match/*.json (uno per partita finita) e ne ricava un unico file
compatto, aurora_indice.json, con:
  - m: elenco partite finite (id, campionato, data, squadre, risultato, arbitro, stadio)
  - p: ultime partite di ogni giocatore (data, voto, minuti, gol, assist, tiri, in porta, xG)
Così l'app non deve scaricare i 19 MB delle singole partite per mostrare
risultati, classifiche e ultime partite.
"""
import glob
import json
import os
from datetime import datetime, timezone

PER_PLAYER = 8

matches = []
players = {}

for path in glob.glob(os.path.join("match", "*.json")):
    try:
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
    except Exception:
        continue
    if not d.get("id") or d.get("sh") is None or d.get("sa") is None:
        continue
    matches.append([d["id"], d.get("lg"), d.get("d"), d.get("h"), d.get("a"),
                    d.get("sh"), d.get("sa"), d.get("ref"), d.get("stad"), d.get("round")])
    keys = d.get("plk") or []
    idx = {k: i for i, k in enumerate(keys)}

    def g(row, key):
        i = idx.get(key)
        return row[2 + i] if i is not None and 2 + i < len(row) else None

    for row in d.get("pl") or []:
        name, side = row[0], row[1]
        mins = g(row, "minutes_played")
        if not mins:
            continue
        team = d["h"] if side == "h" else d["a"]
        opp = d["a"] if side == "h" else d["h"]
        rec = [d["d"], g(row, "rating_title"), mins, g(row, "goals"), g(row, "assists"),
               g(row, "total_shots"), g(row, "ShotsOnTarget"), g(row, "expected_goals"),
               opp, 1 if side == "h" else 0, d["id"]]
        players.setdefault(name + "|" + team, []).append(rec)

matches.sort(key=lambda r: (r[2] or "", r[0]))
for k in players:
    players[k].sort(key=lambda r: r[0], reverse=True)
    players[k] = players[k][:PER_PLAYER]

out = {"updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "m": matches, "p": players}
with open("aurora_indice.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print(len(matches), "partite,", len(players), "giocatori")
