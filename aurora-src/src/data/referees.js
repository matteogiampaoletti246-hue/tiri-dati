// Arbitri da arbitri.json (medie a partita) con foto (refphoto.json) e nazionalità (refcc.json).
import { BASE, RAW } from './load';
import { norm, slug } from './util';
import { lruGet, lruSet } from '@/lib/lru';

export const REFEREES = [];
const BY_ID = {};

export const refereeById = (id) => BY_ID[id] || null;
export const refereesOf = (leagueId) => REFEREES.filter((r) => r.leagueId === leagueId || (r.by && r.by[leagueId]));

const COUNTRY = { ITA: 'Italia', ENG: 'Inghilterra', ESP: 'Spagna', GER: 'Germania', FRA: 'Francia', POR: 'Portogallo', NED: 'Olanda', POL: 'Polonia', SRB: 'Serbia', ROU: 'Romania', SLO: 'Slovenia', SVN: 'Slovenia', TUR: 'Turchia', BEL: 'Belgio', SUI: 'Svizzera', UKR: 'Ucraina', NOR: 'Norvegia', SWE: 'Svezia', SCO: 'Scozia', AUT: 'Austria', CRO: 'Croazia', CZE: 'Rep. Ceca', GRE: 'Grecia', HUN: 'Ungheria', DEN: 'Danimarca', ISR: 'Israele', BUL: 'Bulgaria' };

const ISO2 = { ITA: 'IT', ENG: 'GB', ESP: 'ES', GER: 'DE', FRA: 'FR', POR: 'PT', NED: 'NL', POL: 'PL', SRB: 'RS', ROU: 'RO', SLO: 'SI', SVN: 'SI', TUR: 'TR', BEL: 'BE', SUI: 'CH', UKR: 'UA', NOR: 'NO', SWE: 'SE', SCO: 'GB', AUT: 'AT', CRO: 'HR', CZE: 'CZ', GRE: 'GR', HUN: 'HU', DEN: 'DK', ISR: 'IL', BUL: 'BG', IRL: 'IE', ARM: 'AM', AZE: 'AZ', BIH: 'BA', CYP: 'CY', FIN: 'FI', ISL: 'IS', KAZ: 'KZ', LTU: 'LT', LUX: 'LU', MDA: 'MD', MKD: 'MK', MNE: 'ME', SVK: 'SK', LVA: 'LV', EST: 'EE', ALB: 'AL', GEO: 'GE', MLT: 'MT', KOS: 'XK', BLR: 'BY', FRO: 'FO' };
export const flagOf = (c) => {
  const x = ISO2[c] || (c && c.length === 2 ? c : null);
  return x ? String.fromCodePoint(...x.toUpperCase().split('').map((ch) => 127397 + ch.charCodeAt(0))) : '';
};

const LEAGUE_CC = { 'serie-a': 'ITA', 'premier-league': 'ENG', 'la-liga': 'ESP', 'bundesliga': 'GER', 'ligue-1': 'FRA' };

// stesso arbitro scritto con/senza accenti o maiuscole: unisce i dati (medie pesate sulle partite)
const wavg = (a, na, b, nb) => ((a || 0) * na + (b || 0) * nb) / ((na + nb) || 1);
function mergeDuplicates() {
  const groups = {};
  REFEREES.forEach((r) => {
    (groups[norm(r.name)] = groups[norm(r.name)] || []).push(r);
  });
  const out = [];
  Object.values(groups).forEach((g) => {
    if (g.length === 1) {
      out.push(g[0]);
      return;
    }
    g.sort((a, b) => b.games - a.games);
    const base = { ...g[0], by: {}, matches: [] };
    const seen = new Set();
    let n = 0;
    ['yellowsAvg', 'redsAvg', 'foulsAvg', 'penaltiesAvg'].forEach((k) => (base[k] = 0));
    g.forEach((r) => {
      ['yellowsAvg', 'redsAvg', 'foulsAvg', 'penaltiesAvg'].forEach((k) => (base[k] = wavg(base[k], n, r[k], r.games)));
      n += r.games;
      r.matches.forEach((m) => {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          base.matches.push(m);
        }
      });
      Object.entries(r.by || {}).forEach(([lg, b]) => {
        const c = base.by[lg];
        base.by[lg] = c
          ? { ...c, n: c.n + (b.n || 0), y: wavg(c.y, c.n, b.y, b.n), r: wavg(c.r, c.n, b.r, b.n), fo: wavg(c.fo, c.n, b.fo, b.n), pen: wavg(c.pen, c.n, b.pen, b.n) }
          : { ...b };
      });
    });
    base.games = n;
    base.yellows = Math.round(base.yellowsAvg * n);
    base.reds = Math.round(base.redsAvg * n);
    base.fouls = Math.round(base.foulsAvg * n);
    base.penalties = Math.round(base.penaltiesAvg * n);
    base.matches.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    out.push(base);
  });
  REFEREES.length = 0;
  out.forEach((r) => {
    REFEREES.push(r);
    BY_ID[r.id] = r;
  });
  g_ids_fix();
}
function g_ids_fix() {
  Object.keys(BY_ID).forEach((k) => delete BY_ID[k]);
  REFEREES.forEach((r) => {
    BY_ID[r.id] = r;
  });
}

export function buildReferees() {
  REFEREES.length = 0;
  Object.keys(BY_ID).forEach((k) => delete BY_ID[k]);
  const ref = (RAW.arbitri && RAW.arbitri.ref) || {};
  const photos = (RAW.refphoto && RAW.refphoto.p) || {};
  const cc = (RAW.refcc && RAW.refcc.r) || {};
  Object.entries(ref).forEach(([name, r]) => {
    const games = r.n || 0;
    const item = {
      id: slug(name),
      name,
      photo: null,
      country: COUNTRY[cc[name] || LEAGUE_CC[r.lg]] || cc[name] || '',
      flag: flagOf(cc[name] || LEAGUE_CC[r.lg]),
      leagueId: r.lg || null,
      games,
      yellows: Math.round((r.y || 0) * games),
      reds: Math.round((r.r || 0) * games),
      fouls: Math.round((r.fo || 0) * games),
      penalties: Math.round((r.pen || 0) * games),
      yellowsAvg: r.y || 0,
      redsAvg: r.r || 0,
      foulsAvg: r.fo || 0,
      penaltiesAvg: r.pen || 0,
      matches: (r.m || []).map((m) => ({ date: m[0], home: m[1], away: m[2], sh: m[3], sa: m[4], id: m[5] })),
      by: r.by || {},
    };
    REFEREES.push(item);
    BY_ID[item.id] = item;
  });
  mergeDuplicates();
  REFEREES.sort((a, b) => b.games - a.games || a.name.localeCompare(b.name));
}

// statistiche di stagione dell'arbitro in quel campionato (ammonizioni e falli a partita)
export const refStatsIn = (r, leagueId) => {
  const b = r && r.by && r.by[leagueId];
  if (b) return { n: b.n || 0, y: b.y || 0, fo: b.fo || 0 };
  return r ? { n: r.games, y: r.yellowsAvg, fo: r.foulsAvg } : null;
};

// media di campionato (stagione corrente) degli altri arbitri e valori ordinati per le fasce di colore
export function leagueRefAvg(leagueId) {
  const list = REFEREES.map((r) => (r.by && r.by[leagueId] ? r.by[leagueId] : null)).filter((b) => b && b.n > 0);
  const tot = list.reduce((a, b) => a + b.n, 0);
  if (!tot) return null;
  return {
    n: list.length,
    y: list.reduce((a, b) => a + (b.y || 0) * b.n, 0) / tot,
    fo: list.reduce((a, b) => a + (b.fo || 0) * b.n, 0) / tot,
    ys: list.map((b) => b.y || 0).sort((a, b) => a - b),
    fos: list.map((b) => b.fo || 0).sort((a, b) => a - b),
  };
}

// Ultime due stagioni dell'arbitro in quella competizione (arbitri2/<fm>.json, arbitri_stagioni.py): file piccoli, letti quando si prepara la partita
const TWO = new Map();
const loadTwo = (fm) => {
  const hit = lruGet(TWO, fm);
  if (hit) return hit;
  const p = fetch(`${BASE}arbitri2/${fm}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  lruSet(TWO, fm, p, 12);
  return p;
};
const firstLast = (n) => { const t = norm(n).split(/\s+/).filter(Boolean); return t.length ? `${t[0]} ${t[t.length - 1]}` : ''; };
export async function refTwoSeasons(fm, name) {
  const d = fm && name ? await loadTwo(fm) : null;
  if (!d || !d.ref) return null;
  const k = firstLast(name);
  const key = Object.keys(d.ref).find((x) => norm(x) === norm(name)) || Object.keys(d.ref).find((x) => firstLast(x) === k);
  const v = key && d.ref[key];
  return v && v[0] > 0 ? { n: v[0], y: v[1], fo: v[2], lg: d.lg, seasons: d.s.length } : null;
}

export const findRefereeByName = (name) => (name ? BY_ID[slug(name)] || REFEREES.find((r) => norm(r.name) === norm(name)) || null : null);
