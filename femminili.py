"""Squadre femminili: una sola forma del nome, "Nome F" (stessa regola di aurora-src/src/data/teamMatch.js)."""
import re

WOMEN_COMP = re.compile(r"women|femen|f[eé]minin|femminile|frauen|vrouwen|kvinner|kvind|damallsvenskan|toppserien|\bwsl\b|\bnwsl\b|\bswpl\b|\bswf\b|\bwe league\b|\bliga f\b|copa de la reina|northern super league", re.I)
WOMEN_FM = {256, 11029}  # nomi generici ("A-Liga", "Super Cup"): si riconoscono solo dall'id
WOMEN_WORD = re.compile(r"\b(women'?s?|femenino|femenina|femenil|feminino|feminina|femminile|f[eé]minine|ladies|frauen|vrouwen|kvinner|damen)\b", re.I)
NOT_TEAM = re.compile(r"winner|loser|vincente|/|\btbc\b|\branked\b", re.I)


def is_women_comp(fm, name):
    return int(fm) in WOMEN_FM or bool(WOMEN_COMP.search(str(name or "")))


def is_women_name(n):
    s = str(n or "")
    return bool(re.search(r"\(W\)\s*$", s) or re.search(r"\sF$", s) or WOMEN_WORD.search(s))


def women_name(n):
    s = str(n or "")
    if not s or NOT_TEAM.search(s):
        return s
    base = re.sub(r"\s+", " ", WOMEN_WORD.sub(" ", re.sub(r"\sF$", "", re.sub(r"\s*\(W\)\s*$", "", s)))).strip()
    return (base or s) + " F"
