// Statistiche di squadra per le partite dei campionati aggiunti (stesso formato di metricOf dei top campionati):
// medie a partita della stagione, ricavate dalle partite archiviate. Regola: i minori usano la stessa scheda Statistiche.
import { SRC } from './standings';

const num = (v) => {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const cache = new WeakMap();

// { teams: {tid: {n, sum:{campo:[fatti, subiti]}}} }
function table(det, season) {
  if (cache.has(det)) return cache.get(det);
  const by = {};
  const at = (tid) => (by[tid] = by[tid] || { n: 0, f: {}, c: {}, k: {} });
  (season.fix || []).forEach((x) => {
    if (!x[6] || x[8]) return;
    const d = det.m && det.m[String(x[0])];
    const sc = String(x[5] || '').split(' - ').map(Number);
    if (!d || !d.s || sc.length !== 2 || sc.some(Number.isNaN)) return;
    const pairs = { ...d.s, goals: sc };
    const ap = d.s.accurate_passes;
    if (ap) pairs['accurate_passes%'] = ap.map((v) => { const q = /\((\d+)%\)/.exec(String(v)); return q ? Number(q[1]) : null; });
    [[x[2], 0], [x[3], 1]].forEach(([tid, side]) => {
      const t = at(tid);
      t.n += 1;
      Object.entries(pairs).forEach(([k, v]) => {
        const a = num(v && v[side]);
        const b = num(v && v[1 - side]);
        if (a !== null) { t.f[k] = (t.f[k] || 0) + a; t.k[k] = (t.k[k] || 0) + 1; }
        if (b !== null) t.c[k] = (t.c[k] || 0) + b;
      });
    });
  });
  cache.set(det, by);
  return by;
}

// restituisce { has(tid), value(tid,key), tids() } con le stesse chiavi di standings.metricOf
// somma le tabelle di piu' competizioni (coppa + campionato): media pesata sulle partite, come se fossero un'unica stagione
function merged(m) {
  const base = table(m.det, m.season);
  if (!m.moreDet || !m.moreDet.length) return base;
  if (m._amMerged && m._amMergedN === m.moreDet.length) return m._amMerged;
  const out = {};
  [base, ...m.moreDet.map((x) => table(x.det, x.season))].forEach((tb) => {
    Object.entries(tb).forEach(([tid, t]) => {
      const o = (out[tid] = out[tid] || { n: 0, f: {}, c: {}, k: {} });
      o.n += t.n;
      ['f', 'c', 'k'].forEach((b) => Object.entries(t[b]).forEach(([k, v]) => { o[b][k] = (o[b][k] || 0) + v; }));
    });
  });
  m._amMerged = out; m._amMergedN = m.moreDet.length;
  return out;
}

export function archiveMetrics(m) {
  if (!m || !m.det || !m.season) return null;
  const by = merged(m);
  const value = (tid, key) => {
    const t = by[tid];
    const src = SRC[key];
    if (!t || !src || t.n < 2) return null;
    const [, field, side] = src;
    const bag = side ? t.c : t.f;
    const cnt = t.k[field];
    if (bag[field] === undefined || !cnt) return null;
    return bag[field] / cnt;
  };
  const has = (tid) => value(tid, 'tiri') !== null;
  return { value, has, tids: () => Object.keys(by).filter(has) };
}

// Senza le partite archiviate (es. Eliteserien, campionato greco, Liga Portugal 2) si usano le classifiche di squadra della stagione
// (arch/<fm>/<stagione>_s.json, "teams"): stesse chiavi del Duello in numeri, solo quelle che la fonte da' davvero.
const LIST = { xg: 'expected_goals_team', tiriInPorta: 'ontarget_scoring_att_team', possesso: 'possession_percentage_team', corner: 'corner_taken_team', precisione: 'accurate_pass_team', gol: 'goals_team_match', golSubiti: 'goals_conceded_team_match', inviolata: 'clean_sheet_team' };
export function listMetrics(m) {
  const T = m && m.sTeams;
  if (!T) return null;
  const value = (tid, key) => {
    const rows = T[LIST[key]];
    if (!rows) return null;
    const r = rows.find((x) => String(x[2]) === String(tid));
    return r ? num(r[3]) : null;
  };
  const tids = () => {
    const set = new Set();
    Object.values(LIST).forEach((k) => (T[k] || []).forEach((r) => set.add(String(r[2]))));
    return [...set];
  };
  return { value, has: (tid) => Object.keys(LIST).some((k) => value(tid, k) !== null), tids, fromLists: true };
}
