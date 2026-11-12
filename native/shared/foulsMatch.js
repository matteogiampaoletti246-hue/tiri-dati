// Falli di una partita: chi ha fatto fallo a chi e a che minuto. Fonte: cronaca ESPN ("Foul by X (Squadra)" + chi subisce),
// la stessa che usa `falli_coppie.py` per i ruoli. Vale per partite live e finite delle competizioni che ESPN copre con i falli;
// se la partita non e' trovata o non ha falli nominativi, non c'e' niente da mostrare (il tasto non compare).
import { useEffect, useState } from 'react';
import { teamById } from '@/data/teams';
import { FM_ID } from '@/data/archive';

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/';
// stesso elenco di LEGHE in falli_coppie.py (chiave competizione dell'app -> codice ESPN); aggiungere qui e li' insieme
const BY_KEY = {
  'serie-a': 'ita.1', 'premier-league': 'eng.1', 'la-liga': 'esp.1', bundesliga: 'ger.1', 'ligue-1': 'fra.1', 'champions-league': 'uefa.champions',
  'europa-league': 'uefa.europa', 'conference-league': 'uefa.europa.conf', 'coppa-italia': 'ita.coppa_italia', 'dfb-pokal': 'ger.dfb_pokal',
  'coupe-de-france': 'fra.coupe_de_france', 'efl-cup': 'eng.league_cup', eredivisie: 'ned.1', 'liga-portugal': 'por.1', 'fm-132': 'eng.fa',
  'fm-138': 'esp.copa_del_rey', 'fm-77': 'fifa.world', 'fm-10195': 'fifa.worldq.uefa', 'fm-9806': 'uefa.nations', 'fm-9807': 'uefa.nations',
  'fm-9808': 'uefa.nations', 'fm-9809': 'uefa.nations',
};
const BY_FM = {
  55: 'ita.1', 47: 'eng.1', 87: 'esp.1', 54: 'ger.1', 53: 'fra.1', 42: 'uefa.champions', 73: 'uefa.europa', 10216: 'uefa.europa.conf', 141: 'ita.coppa_italia',
  209: 'ger.dfb_pokal', 134: 'fra.coupe_de_france', 133: 'eng.league_cup', 57: 'ned.1', 61: 'por.1', 132: 'eng.fa', 138: 'esp.copa_del_rey', 77: 'fifa.world',
  10195: 'fifa.worldq.uefa', 9806: 'uefa.nations', 9807: 'uefa.nations', 9808: 'uefa.nations', 9809: 'uefa.nations',
};
const codeOf = (m) => BY_KEY[m.leagueId] || BY_FM[(m.archive && m.archive.fm) || FM_ID[m.leagueId]] || null;

const toks = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
const bigr = (s) => { const o = new Map(); for (let i = 0; i < s.length - 1; i += 1) { const g = s.slice(i, i + 2); o.set(g, (o.get(g) || 0) + 1); } return o; };
function ratio(a, b) { // somiglianza 0..1 (Dice sui bigrammi)
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const A = bigr(a); const B = bigr(b);
  let hit = 0;
  A.forEach((n, g) => { hit += Math.min(n, B.get(g) || 0); });
  return (2 * hit) / (a.length - 1 + b.length - 1);
}
const subset = (x, y) => x.every((t) => y.includes(t));
function sim(a, b) {
  const ta = toks(a); const tb = toks(b);
  if (!ta.length || !tb.length) return 0;
  if (ta.some((t) => tb.includes(t)) && (subset(ta, tb) || subset(tb, ta))) return 1;
  return ratio(ta.join(' '), tb.join(' '));
}
// giocatore della rosa con quel nome (stesse soglie di `trova` in falli_coppie.py)
function trova(nome, roster) {
  const tn = toks(nome);
  if (!tn.length) return null;
  let best = null; let bs = 0;
  for (const p of roster) {
    const tl = toks(p.name);
    if (tl.join(' ') === tn.join(' ')) return p;
    let s = ratio(tn.join(' '), tl.join(' '));
    if (tl.length && tn[tn.length - 1] === tl[tl.length - 1]) s += 0.25;
    if (subset(tn, tl) || subset(tl, tn)) s += 0.2;
    if (s > bs) { best = p; bs = s; }
  }
  return best && bs >= 0.85 ? best : null;
}

const getJson = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
};

const parse = (summ, match) => {
  const hn = (teamById(match.homeId) || {}).name || '';
  const an = (teamById(match.awayId) || {}).name || '';
  const rosterOf = (side) => { const lu = match.lineup && match.lineup[side]; return lu ? [...(lu.xi || []), ...(lu.bench || [])].filter((p) => p && p.name) : []; };
  const R = { home: rosterOf('home'), away: rosterOf('away') };
  const com = summ.commentary || [];
  const out = [];
  const seen = new Set();
  com.forEach((c, ci) => {
    const mt = /^Foul by (.+?) \((.+?)\)\.?$/.exec(c.text || '');
    if (!mt) return;
    const pl = c.play || {};
    let parts = (pl.participants || []).map((x) => x && x.athlete && x.athlete.displayName);
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      parts = [];
      for (const nb of [ci + 1, ci - 1, ci + 2]) {
        const mv = com[nb] && /^(.+?) \((.+?)\) wins a free kick/.exec(com[nb].text || '');
        if (mv && sim(mv[2], mt[2]) < 0.9) { parts = [mt[1], mv[1]]; break; }
      }
      if (parts.length < 2) return;
    }
    const t = c.time || {};
    const key = `${c.sequence}|${parts[0]}|${parts[1]}|${t.value}`;
    if (seen.has(key)) return;
    seen.add(key);
    const inH = trova(parts[0], R.home); const inA = trova(parts[0], R.away);
    // lato di chi commette il fallo: dalla rosa se il nome si trova solo in una squadra, altrimenti dal nome della squadra tra parentesi
    const fSide = inH && !inA ? 'home' : inA && !inH ? 'away' : sim(mt[2], hn) >= sim(mt[2], an) ? 'home' : 'away';
    const vSide = fSide === 'home' ? 'away' : 'home';
    const mk = (nm, side) => { const p = trova(nm, R[side]); return { side, name: p ? p.name : nm, fmId: p && p.fmId ? String(p.fmId) : null }; };
    const secs = Number(t.value);
    out.push({ t: Number.isFinite(secs) ? secs : 0, label: String(t.displayValue || (Number.isFinite(secs) ? `${Math.max(1, Math.ceil(secs / 60))}'` : '')).trim(), f: mk(parts[0], fSide), v: mk(parts[1], vSide) });
  });
  return out.sort((a, b) => a.t - b.t);
};

const CACHE = new Map(); // matchId -> { at, event, p }
const dayOf = (t) => { const d = new Date(t); return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`; };
async function findEvent(code, match) {
  const hn = (teamById(match.homeId) || {}).name || ''; const an = (teamById(match.awayId) || {}).name || '';
  const t0 = match.ts || Date.now();
  // giorno UTC della partita, poi quello prima e dopo (le partite serali/notturne cambiano giorno)
  for (const t of [t0, t0 - 86400000, t0 + 86400000]) {
    const sb = await getJson(`${ESPN}${code}/scoreboard?dates=${dayOf(t)}&limit=300`).catch(() => null);
    let best = null; let bs = 0;
    ((sb && sb.events) || []).forEach((ev) => {
      const cs = {};
      ((ev.competitions && ev.competitions[0] && ev.competitions[0].competitors) || []).forEach((c) => { cs[c.homeAway] = c.team ? [c.team.displayName, c.team.shortDisplayName, c.team.name, c.team.location] : []; });
      const top = (n, arr) => Math.max(0, ...(arr || []).map((x) => sim(n, x)));
      const sc = top(hn, cs.home) + top(an, cs.away);
      if (sc > bs) { best = ev; bs = sc; }
    });
    if (best && bs >= 1.3) return best.id;
  }
  return null;
}
async function load(match, fresh) {
  const code = codeOf(match);
  if (!code) return null;
  const hit = CACHE.get(match.id);
  // chi ha gia' i falli e la partita e' finita non si riscarica; vuoto o partita in corso: si riprova (prima restava "nessun falli" per sempre)
  if (hit && !fresh && Date.now() - hit.at < 25000) return hit.p;
  const eventId = hit && hit.event;
  const p = (async () => {
    const id = eventId || (await findEvent(code, match));
    if (!id) return null;
    const summ = await getJson(`${ESPN}${code}/summary?event=${id}`);
    const list = parse(summ, match);
    CACHE.set(match.id, { at: Date.now(), event: id, p: Promise.resolve(list.length ? list : null) });
    return list.length ? list : null;
  })().catch(() => null);
  CACHE.set(match.id, { at: Date.now(), event: eventId, p });
  return p;
}

// Falli della partita (null finche' non arrivano o se non ce ne sono). In live si aggiorna ogni 30 secondi.
export function useMatchFouls(match) {
  const [list, setList] = useState(null);
  const id = match ? match.id : null;
  const live = !!match && match.status !== 'finished' && match.status !== 'scheduled';
  useEffect(() => {
    if (!match) { setList(null); return undefined; }
    let on = true;
    const run = (fresh) => load(match, fresh).then((l) => { if (on) setList(l || null); });
    setList(null);
    run(live);
    const tm = live ? setInterval(() => run(true), 30000) : null;
    return () => { on = false; if (tm) clearInterval(tm); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, live]);
  return list;
}

// Falli di un giocatore: 'fc' = quelli che ha commesso (raggruppati per chi li ha subiti), 'fs' = quelli subiti (raggruppati per chi li ha fatti).
export function playerFouls(list, name, fmId, kind) {
  if (!list) return [];
  const me = toks(name).join(' ');
  const is = (x) => (fmId && x.fmId && String(x.fmId) === String(fmId)) || toks(x.name).join(' ') === me;
  const g = new Map();
  list.forEach((e) => {
    const mine = kind === 'fc' ? is(e.f) : is(e.v);
    if (!mine) return;
    const o = kind === 'fc' ? e.v : e.f;
    const k = o.fmId || toks(o.name).join(' ');
    const r = g.get(k) || { who: o, mins: [], t0: e.t };
    r.mins.push(e.label);
    g.set(k, r);
  });
  return [...g.values()].sort((a, b) => b.mins.length - a.mins.length || a.t0 - b.t0);
}
