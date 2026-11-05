// Migliori Matchup / Arbitri: medie cartellini (totali e 1T) degli arbitri designati per le partite del giorno.
// Medie dalle gare vere delle ultime due stagioni (arbitri3/, arbitri_gare.py); arbitro designato da FotMob (loadFm) o da arbitri_extra.json.
import { useEffect, useState } from 'react';
import { BASE } from './load';
import { matchesByDate } from './matches';
import { teamByName } from './teams';
import { loadFm } from './fotmob';
import { playerLookup } from './players';
import { refGames } from './referees';
import { dayMatches, TOP } from './matchups';
import { lruGet, lruSet } from '@/lib/lru';

const MIN_GAMES = 5; // sotto le 5 gare con il dato la media dell'arbitro non e' affidabile
const r1 = (x) => Math.round(x * 10) / 10;

let EXTRA = null;
const arbitriExtra = () => {
  if (!EXTRA) EXTRA = fetch(`${BASE}arbitri_extra.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return EXTRA;
};

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
    if (!name && am.fmId) {
      const ex = await arbitriExtra();
      const h = ex && ex[String(am.fmId)];
      if (h && h.n) name = h.n;
    }
  }
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
    const list = dayMatches(date);
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
  dayMatches(date).forEach((m) => {
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
  dayMatches(date).forEach((m) => {
    const r = refMap[m.id];
    const avg = r && r.avg[period];
    if (!avg) return;
    all.push({ m, name: r.name, v: avg.avg, n: avg.n });
  });
  all.sort((x, y) => (mode === 'under' ? x.v - y.v : y.v - x.v));
  return all.slice(0, TOP).map(({ m, name, v, n }) => {
    const home = teamByName(m.home);
    const away = teamByName(m.away);
    return {
      id: m.id, referee: { name, n }, mode, period, homeId: home ? home.id : null, awayId: away ? away.id : null, homeName: m.home, awayName: m.away,
      league: m.league, date: m.date, home: m[cards[0]] == null ? null : m[cards[0]], away: m[cards[1]] == null ? null : m[cards[1]],
      center: r1(v), centerLabel: 'Arbitro', type: { key: 'referees', label: period === 'first' ? 'Cartellini 1T' : 'Cartellini' },
      playedHome: null, playedAway: null,
    };
  });
}
