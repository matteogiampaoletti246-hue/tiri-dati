// Migliori Matchup / Arbitri: medie cartellini (totali e 1T) degli arbitri designati per le partite del giorno.
// Medie dalle gare vere delle ultime due stagioni (arbitri3/, arbitri_gare.py); arbitro designato da FotMob (loadFm), poi UEFA e arbitri_extra.json (arbitriDesignati.js).
import { useEffect, useState } from 'react';
import { designatedReferee } from './arbitriDesignati';
import { matchesByDate } from './matches';
import { teamByName, teamByFm } from './teams';
import { loadFm } from './fotmob';
import { playerLookup } from './players';
import { refGames } from './referees';
import { matchupList, TOP } from './matchups';
import { lruGet, lruSet } from '@/lib/lru';

const MIN_GAMES = 5; // sotto le 5 gare con il dato la media dell'arbitro non e' affidabile
const r1 = (x) => Math.round(x * 10) / 10;

// media cartellini dell'arbitro: totale e 1T (solo gare con il dato)
const AVG = new Map();
async function refAverages(name) {
  const hit = lruGet(AVG, name);
  if (hit) return hit;
  const g = await refGames(name).catch(() => null);
  const rows = (g && g.m) || [];
  const mean = (i) => {
    const v = rows.map((x) => x[i]).filter((x) => typeof x === 'number');
    return v.length >= MIN_GAMES ? { avg: v.reduce((a, b) => a + b, 0) / v.length, n: v.length } : null;
  };
  const out = { total: mean(8), first: mean(9) };
  lruSet(AVG, name, out, 300);
  return out;
}

// id partita angoli -> nome arbitro designato (null = non ancora designato)
const NAMES = new Map();

function appMatchOf(date, m) {
  const h = teamByName(m.home);
  const a = teamByName(m.away);
  if (!h || !a) return null;
  return matchesByDate(date).find((x) => x.homeId === h.id && x.awayId === a.id) || null;
}

async function nameFor(date, m) {
  const k = `${date}|${m.id}`;
  const hit = lruGet(NAMES, k);
  if (hit !== undefined) return hit;
  const am = appMatchOf(date, m);
  let name = (am && am.refereeName) || null;
  if (am && !name && am.status === 'scheduled') {
    await loadFm(am, playerLookup).catch(() => null);
    name = am.refereeName || null;
    if (!name && am.fmId) name = await designatedReferee(am.fmId);
  }
  // nazionali: l'id della partita e' gia' quello FotMob (la UEFA designa gli arbitri molto prima di FotMob)
  if (!name && /^\d+$/.test(String(m.id))) name = await designatedReferee(m.id);
  // senza arbitro non si memorizza: potrebbe essere designato piu' tardi
  if (name) lruSet(NAMES, k, name, 800);
  return name;
}

const pool = async (items, n, fn) => {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const it = items[i];
      i += 1;
      await fn(it);
    }
  }));
};

// Arbitri designati del giorno con le loro medie. Parte solo se enabled (il giorno mostrato), a poco a poco.
export function useDayReferees(date, enabled) {
  const [, bump] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!enabled || !date) return undefined;
    let dead = false;
    setDone(false);
    const list = matchupList(date);
    (async () => {
      await pool(list, 3, async (m) => {
        const name = await nameFor(date, m);
        if (name) await refAverages(name);
        if (!dead) bump((x) => x + 1);
      });
      if (!dead) setDone(true);
    })();
    return () => { dead = true; };
  }, [date, enabled]);

  const map = {};
  matchupList(date).forEach((m) => {
    const name = lruGet(NAMES, `${date}|${m.id}`);
    const avg = name ? lruGet(AVG, name) : null;
    if (name && avg) map[m.id] = { name, avg };
  });
  return { map, done };
}

// Righe della sezione Arbitri: le partite con l'arbitro piu' (Over) o meno (Under) severo, per Totale o 1T.
export function refereeRows(date, modeKey, refMap) {
  const [mode, period] = modeKey.split('|');
  const cards = period === 'first' ? ['cards_1t_home', 'cards_1t_away'] : ['cards_home', 'cards_away'];
  const all = [];
  matchupList(date).forEach((m) => {
    const r = refMap[m.id];
    const avg = r && r.avg[period];
    if (!avg) return;
    all.push({ m, name: r.name, v: avg.avg, n: avg.n });
  });
  all.sort((x, y) => (mode === 'under' ? x.v - y.v : y.v - x.v));
  return all.slice(0, TOP).map(({ m, name, v, n }) => {
    const home = teamByName(m.home) || teamByFm(m.hid);
    const away = teamByName(m.away) || teamByFm(m.aid);
    return {
      id: m.id, fm: m.fm, sk: m.sk, referee: { name, n }, mode, period, homeId: home ? home.id : null, awayId: away ? away.id : null, homeName: m.home, awayName: m.away,
      league: m.league, date: m.date, home: m[cards[0]] == null ? null : m[cards[0]], away: m[cards[1]] == null ? null : m[cards[1]],
      center: r1(v), centerLabel: 'Arbitro', type: { key: 'referees', label: period === 'first' ? 'Cartellini 1T' : 'Cartellini' },
      playedHome: null, playedAway: null,
    };
  });
}

// Contorno dorato (solo Cartellini e Arbitri, Over/Under): la partita ha medie buone sia per le squadre sia per l'arbitro rispetto alla voce scelta.
// Over = medie alte, Under = medie basse, Totale o 1T come la tendina. "Buone" = nella meta' migliore del giorno (al massimo le prime TOP) per la somma
// dei cartellini attesi delle due squadre E per la media dell'arbitro, cosi' in un giorno con poche partite non si illumina tutto.
export function goldIds(date, modeKey, refMap) {
  const [mode, period] = modeKey.split('|');
  const out = new Set();
  if (mode === 'gap') return out;
  const f = period === 'first' ? ['cards_1t_home', 'cards_1t_away'] : ['cards_home', 'cards_away'];
  const dir = mode === 'under' ? 1 : -1;
  const teams = [];
  const refs = [];
  matchupList(date).forEach((m) => {
    const a = m[f[0]];
    const b = m[f[1]];
    const r = refMap[m.id];
    const avg = r && r.avg[period];
    if (a != null && b != null) teams.push({ id: m.id, v: a + b });
    if (avg) refs.push({ id: m.id, v: avg.avg });
  });
  const best = (arr) => {
    const lim = Math.min(TOP, Math.max(1, Math.ceil(arr.length / 2)));
    return new Set(arr.sort((x, y) => dir * (x.v - y.v)).slice(0, lim).map((x) => x.id));
  };
  const t = best(teams);
  best(refs).forEach((id) => { if (t.has(id)) out.add(id); });
  return out;
}
