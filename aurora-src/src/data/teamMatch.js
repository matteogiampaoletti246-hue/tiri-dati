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

// Seconde squadre, riserve, giovanili e femminili: due nomi che differiscono per uno di questi segni non sono MAI la stessa squadra
// ("Real Sociedad B" non e' "Real Sociedad", "Jong Ajax" non e' "Ajax", "Bayern II" non e' "Bayern").
const RESERVE = new Set(['b', 'ii', 'iii', '2', 'u17', 'u18', 'u19', 'u20', 'u21', 'u22', 'u23', 'sub', 'reserves', 'reserve', 'res', 'castilla', 'jong', 'promesas', 'youth', 'academy', 'primavera', 'amateure', 'women', 'femenino', 'feminino', 'femminile', 'feminine', 'ladies', 'frauen', 'vrouwen']);
const words = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
export const reserveTag = (name) => memo(RC, String(name || ''), (x) => words(x).filter((t) => RESERVE.has(t)).sort().join(' '));
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
