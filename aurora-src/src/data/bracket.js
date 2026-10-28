// Tabellone a eliminazione diretta ricavato dal calendario archiviato (arch/<fm>/<stagione>.json).
// Regola: vale per ogni competizione con fasi a eliminazione (coppe europee e, in futuro, coppe nazionali):
// basta aggiungere l'id FotMob in CUP_FM. Ogni turno e' formato da "sfide" (andata+ritorno o gara unica).
import { loadSeason, loadSeasonMatches } from './archive';

export const CUP_FM = new Set([42, 73, 10216]);
export const hasCup = (fm) => CUP_FM.has(Number(fm));
export const CUP_NAME = { 42: 'UEFA Champions League', 73: 'UEFA Europa League', 10216: 'UEFA Conference League' };

const ROUND_ORDER = ['playoff', '1/32', '1/16', '1/8', '1/4', '1/2', 'final'];
export const ROUND_LABEL = { playoff: 'Spareggi', '1/32': 'Trentaduesimi', '1/16': 'Sedicesimi', '1/8': 'Ottavi', '1/4': 'Quarti', '1/2': 'Semifinali', final: 'Finale' };
const key = (a, b) => [String(a), String(b)].sort().join('-');
const goals = (m) => {
  const sc = String(m[5] || '').split(' - ').map(Number);
  return sc.length === 2 && !sc.some(Number.isNaN) ? sc : null;
};

// sfide di un turno (le gare con le stesse due squadre) con aggregato e partite
function tiesOf(fix, round) {
  const by = {};
  fix.filter((m) => m[1] === round && !m[8]).forEach((m) => {
    const k = key(m[2], m[3]);
    (by[k] = by[k] || []).push(m);
  });
  return Object.values(by).map((legs) => {
    legs.sort((x, y) => String(x[4]).localeCompare(String(y[4])));
    const a = String(legs[0][2]);
    const b = String(legs[0][3]);
    let sa = 0; let sb = 0; let awayA = 0; let awayB = 0; let played = true;
    legs.forEach((m) => {
      const g = goals(m);
      if (!m[6] || !g) { played = false; return; }
      const [h, w] = g;
      if (String(m[2]) === a) { sa += h; sb += w; awayB += w; } else { sb += h; sa += w; awayA += w; }
    });
    return {
      round, a, b, sa, sb, awayA, awayB, played, date: legs[legs.length - 1][4],
      legs: legs.map((m) => ({ mid: m[0], h: String(m[2]), a: String(m[3]), score: goals(m) && m[6] ? goals(m) : null, date: m[4] })),
      pen: null, win: null,
    };
  });
}

// quando le sfide sono pari si guardano i rigori (evento PenaltyShootout nella partita) e, prima del 2021/22, i gol fuori casa
function decide(t, det, old) {
  if (!t.played) return;
  if (t.sa !== t.sb) { t.win = t.sa > t.sb ? 'a' : 'b'; return; }
  const last = t.legs[t.legs.length - 1];
  const x = det && det.m && det.m[last.mid];
  const ev = x && (x.e || []).find((e) => e.type === 'PenaltyShootout');
  if (ev && ev.homeScore != null) {
    const [ha, aw] = [Number(ev.homeScore), Number(ev.awayScore)];
    const aIsHome = last.h === t.a;
    t.pen = aIsHome ? [ha, aw] : [aw, ha];
    t.win = t.pen[0] > t.pen[1] ? 'a' : t.pen[1] > t.pen[0] ? 'b' : null;
    return;
  }
  if (old && t.awayA !== t.awayB) t.win = t.awayA > t.awayB ? 'a' : 'b';
}

// ordina le sfide come in un albero: ogni sfida e' tra le due da cui provengono le squadre
function order(rounds) {
  const out = rounds.map((r) => r.ties.slice());
  for (let i = out.length - 2; i >= 0; i -= 1) {
    const placed = [];
    const left = out[i].slice();
    out[i + 1].forEach((p) => {
      [p.a, p.b].forEach((tid) => {
        const k = left.findIndex((t) => t.a === tid || t.b === tid);
        if (k >= 0) placed.push(left.splice(k, 1)[0]);
      });
    });
    out[i] = placed.concat(left.sort((x, y) => String(x.date).localeCompare(String(y.date))));
  }
  out[out.length - 1].sort((x, y) => String(x.date).localeCompare(String(y.date)));
  return rounds.map((r, i) => ({ ...r, ties: out[i] }));
}

// posizioni in "slot": il primo turno e' in fila, i turni dopo stanno al centro delle sfide da cui arrivano
function layout(rounds) {
  const n0 = rounds[0].ties.length;
  rounds.forEach((r, ri) => {
    r.ties.forEach((t, i) => {
      if (ri === 0) { t.cy = i + 0.5; return; }
      const kids = rounds[ri - 1].ties.filter((k) => k.a === t.a || k.b === t.a || k.a === t.b || k.b === t.b);
      t.kids = kids;
      t.cy = kids.length ? kids.reduce((s, k) => s + k.cy, 0) / kids.length : (i + 0.5) * (n0 / r.ties.length);
    });
  });
  return n0;
}

// i tabelloni gia' caricati restano in memoria: tornando da una partita si ridisegnano subito, senza "Carico..." e senza animazioni
const MEM = new Map();
export const peekBracket = (fm, sk) => MEM.get(`${fm}-${sk}`);
export const loadBracket = async (fm, sk) => {
  const k = `${fm}-${sk}`;
  if (MEM.has(k)) return MEM.get(k);
  const r = await loadBracketRaw(fm, sk);
  if (r && r.rounds && r.rounds.length) MEM.set(k, r);
  return r;
};
const loadBracketRaw = async (fm, sk) => {
  const s = await loadSeason(fm, sk);
  if (!s || !s.fix) return null;
  const present = ROUND_ORDER.filter((k) => s.fix.some((m) => m[1] === k));
  if (!present.length) return { rounds: [], names: s.teams || {} };
  const rounds = present.map((k) => ({ key: k, label: ROUND_LABEL[k], ties: tiesOf(s.fix, k) })).filter((r) => r.ties.length);
  let det = null;
  if (rounds.some((r) => r.ties.some((t) => t.played && t.sa === t.sb))) det = await loadSeasonMatches(fm, sk);
  const old = Number(String(sk).slice(0, 4)) < 2021;
  rounds.forEach((r) => r.ties.forEach((t) => decide(t, det, old)));
  const ordered = order(rounds);
  const slots = layout(ordered);
  return { rounds: ordered, slots, names: s.teams || {} };
};
