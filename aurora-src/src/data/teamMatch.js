import { lruGet, lruSet } from '@/lib/lru';
// Confronto nomi squadra tra fonti diverse (FotMob, PitchAPI, ...): una sola regola per tutta l'app.
const ALIAS = [[/\bmanchester\b/g, 'man'], [/\bnottingham\b/g, 'nottm'], [/\bmunchen\b/g, 'munich'], [/\bm gladbach\b|\bmonchengladbach\b|\bmgladbach\b/g, 'gladbach'], [/\bsaint\b/g, 'st'], [/\bborussia\b/g, ' '], [/\bwolverhampton wanderers\b/g, 'wolves'], [/\btottenham hotspur\b/g, 'tottenham'], [/\bsheffield\b/g, 'sheff'], [/\bunited\b/g, 'utd'], [/\bwednesday\b/g, 'wed']];
// nomi gia' normalizzati (capienza fissa): gli abbinamenti confrontano gli stessi nomi migliaia di volte
const NC = new Map();
const RC = new Map();
const memo = (map, k, f) => { const h = lruGet(map, k); if (h !== undefined) return h; const v = f(k); lruSet(map, k, v, 6000); return v; };
export const norm = (n) => memo(NC, String(n || ''), normRaw);
const normRaw = (n) => {
  let x = String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\b(fc|ac|as|ss|us|afc|cf|sc|calcio|1\w*)\b/g, ' ');
  ALIAS.forEach(([re, to]) => { x = x.replace(re, to); });
  return x.replace(/\s+/g, ' ').trim();
};
// sigla ("Paris Saint-Germain" -> "psg")
export const acr = (n) => String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[\s-]+/).filter(Boolean).map((t) => t[0]).join('');

// Squadre femminili: FotMob le chiama spesso come le maschili ("Barcelona" in Liga F) o con "(W)". Una sola forma in tutta l'app: "Barcelona F".
// Stessa regola in femminili.py (giorni/ e tidx/). Competizione femminile = dal nome, oppure (nomi generici come "Super Cup") WOMEN_FM o squadre con "(W)".
const WOMEN_COMP = /women|femen|f[eé]minin|femminile|frauen|vrouwen|kvinner|kvind|damallsvenskan|toppserien|\bwsl\b|\bnwsl\b|\bswpl\b|\bswf\b|\bwe league\b|\bliga f\b|copa de la reina|northern super league/i;
const WOMEN_FM = new Set([256, 11029]);
const WOMEN_WORD = /\b(women'?s?|femenino|femenina|femenil|feminino|feminina|femminile|f[eé]minine|ladies|frauen|vrouwen|kvinner|damen)\b/i;
const NOT_TEAM = /winner|loser|vincente|\/|\btbc\b|\branked\b/i;
export const isWomenComp = (fm, name) => WOMEN_FM.has(Number(fm)) || WOMEN_COMP.test(String(name || ''));
export function isWomenName(n) { const s = String(n || ''); return /\(W\)\s*$/.test(s) || /\sF$/.test(s) || WOMEN_WORD.test(s); }
export const womenName = (n) => {
  const s = String(n || '');
  if (!s || NOT_TEAM.test(s)) return s;
  const base = s.replace(/\s*\(W\)\s*$/, '').replace(/\sF$/, '').replace(new RegExp(WOMEN_WORD.source, 'gi'), ' ').replace(/\s+/g, ' ').trim();
  return `${base || s} F`;
};

// Seconde squadre, riserve, giovanili e femminili: due nomi che differiscono per uno di questi segni non sono MAI la stessa squadra
// ("Real Sociedad B" non e' "Real Sociedad", "Jong Ajax" non e' "Ajax", "Bayern II" non e' "Bayern").
const RESERVE = new Set(['b', 'ii', 'iii', '2', 'u17', 'u18', 'u19', 'u20', 'u21', 'u22', 'u23', 'sub', 'reserves', 'reserve', 'res', 'castilla', 'jong', 'promesas', 'youth', 'academy', 'primavera', 'amateure']);
const words = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
export const reserveTag = (name) => memo(RC, String(name || ''), (x) => { const t = words(x).filter((w) => RESERVE.has(w)); if (isWomenName(x)) t.push('f'); return t.sort().join(' '); });
export const sameSquad = (a, b) => reserveTag(a) === reserveTag(b);

// Cerca tra le squadre dell'app quella che corrisponde a `name`: nome uguale, poi nome normalizzato, poi sigla,
// poi nome contenuto -- ma solo tra squadre dello stesso paese (mai due squadre diverse che si somigliano: "Arsenal" inglese e francese).
export function findAppTeam(name, teams, sameCountry) {
  const n = norm(name);
  if (!n) return null;
  const pool = (sameCountry ? teams.filter(sameCountry) : teams).filter((t) => sameSquad(t.name, name));
  let hit = pool.filter((t) => norm(t.name) === n);
  if (hit.length === 1) return hit[0];
  if (!sameCountry) return null; // senza paese certo (coppe internazionali) solo corrispondenza esatta
  const a = acr(name);
  if (a.length >= 3) { hit = pool.filter((t) => norm(t.name) === a || acr(t.name) === n); if (hit.length === 1) return hit[0]; }
  const cand = pool.filter((t) => { const m = norm(t.name); return m && m.length >= 4 && n.length >= 4 && (m.includes(n) || n.includes(m)); });
  return cand.length === 1 ? cand[0] : null;
}
