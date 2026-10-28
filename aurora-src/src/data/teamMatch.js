// Confronto nomi squadra tra fonti diverse (FotMob, PitchAPI, ...): una sola regola per tutta l'app.
const ALIAS = [[/\bmanchester\b/g, 'man'], [/\bnottingham\b/g, 'nottm'], [/\bmunchen\b/g, 'munich'], [/\bm gladbach\b|\bmonchengladbach\b|\bmgladbach\b/g, 'gladbach'], [/\bsaint\b/g, 'st'], [/\bborussia\b/g, ' '], [/\bwolverhampton wanderers\b/g, 'wolves'], [/\btottenham hotspur\b/g, 'tottenham']];
export const norm = (n) => {
  let x = String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\b(fc|ac|as|ss|us|afc|cf|sc|calcio|1\w*)\b/g, ' ');
  ALIAS.forEach(([re, to]) => { x = x.replace(re, to); });
  return x.replace(/\s+/g, ' ').trim();
};
// sigla ("Paris Saint-Germain" -> "psg")
export const acr = (n) => String(n || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[\s-]+/).filter(Boolean).map((t) => t[0]).join('');

// Cerca tra le squadre dell'app quella che corrisponde a `name`: nome uguale, poi nome normalizzato, poi sigla,
// poi nome contenuto -- ma solo tra squadre dello stesso paese (mai due squadre diverse che si somigliano: "Arsenal" inglese e francese).
export function findAppTeam(name, teams, sameCountry) {
  const n = norm(name);
  if (!n) return null;
  const pool = sameCountry ? teams.filter(sameCountry) : teams;
  let hit = pool.filter((t) => norm(t.name) === n);
  if (hit.length === 1) return hit[0];
  if (!sameCountry) return null; // senza paese certo (coppe internazionali) solo corrispondenza esatta
  const a = acr(name);
  if (a.length >= 3) { hit = pool.filter((t) => norm(t.name) === a || acr(t.name) === n); if (hit.length === 1) return hit[0]; }
  const cand = pool.filter((t) => { const m = norm(t.name); return m && m.length >= 4 && n.length >= 4 && (m.includes(n) || n.includes(m)); });
  return cand.length === 1 ? cand[0] : null;
}
