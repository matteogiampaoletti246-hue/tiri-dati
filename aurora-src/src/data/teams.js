// Squadre. Nome, stemma e campionato arrivano dai file dati; il colore da teams.json.
import { RAW } from './load';
import { LEAGUES, TOP5 } from './leagues';
import { slug } from './util';
import { fixedColors } from './teamColorFix';

export const TEAMS = [];
export const TEAMS_BY_LEAGUE = {};
const INDEX = {};
const BY_NAME = {};

export const teamById = (id) => INDEX[id] || null;
export const teamsOf = (leagueId) => TEAMS_BY_LEAGUE[leagueId] || [];
export const teamByName = (name) => BY_NAME[name] || null;
// Indice per teamByFm: id FotMob -> posizione della PRIMA squadra in TEAMS con quel fmId, e con quello stemma (teamlogo/<id>.png).
// Stesso risultato della ricerca su tutto l'elenco (aprendo una partita si cercavano centinaia di squadre tra migliaia: secondi di lavoro).
// TEAMS cresce solo in coda (ensureTeam): le squadre nuove si aggiungono all'indice alla ricerca dopo; fmId e stemma di una squadra gia'
// presente si cambiano solo con setTeamFm / setTeamCrest, che tengono l'indice allineato.
let FMX = null; // { n: squadre indicizzate, fm: Map, cr: Map, pos: Map squadra -> posizione }
const isLine = (ch) => ch === '\n' || ch === '\r' || ch === ' ' || ch === ' ';
// tutti gli id numerici k per cui /teamlogo\/k\.png/ trova lo stemma c (il punto della RegExp vale qualunque carattere tranne a capo)
const crestKeys = (c, out) => {
  for (let p = c.indexOf('teamlogo/'); p !== -1; p = c.indexOf('teamlogo/', p + 1)) {
    const s0 = p + 9;
    let j = s0;
    while (j < c.length && c.charCodeAt(j) >= 48 && c.charCodeAt(j) <= 57) j += 1;
    for (let q = s0 + 1; q <= j && q < c.length; q += 1) if (!isLine(c[q]) && c.startsWith('png', q + 1)) out.push(c.slice(s0, q));
  }
  return out;
};
const fmKey = (t) => (t.fmId ? String(t.fmId) : '');
const putMin = (map, k, i) => { const o = map.get(k); if (o === undefined || o > i) map.set(k, i); };
const indexTeams = () => {
  if (!FMX) FMX = { n: 0, fm: new Map(), cr: new Map(), pos: new Map() };
  for (let i = FMX.n; i < TEAMS.length; i += 1) {
    const t = TEAMS[i];
    FMX.pos.set(t, i);
    const k = fmKey(t);
    if (k) putMin(FMX.fm, k, i);
    if (t.crest) crestKeys(String(t.crest), []).forEach((x) => putMin(FMX.cr, x, i));
  }
  FMX.n = TEAMS.length;
};
// cambio dell'id FotMob di una squadra gia' creata (al posto di `t.fmId = v`)
export const setTeamFm = (t, v) => {
  const old = fmKey(t);
  t.fmId = v;
  const k = fmKey(t);
  const i = FMX ? FMX.pos.get(t) : undefined;
  if (i === undefined || k === old) return; // non ancora indicizzata (entrera' con il valore nuovo) o id uguale
  if (old && FMX.fm.get(old) === i) { FMX = null; return; } // era la prima con il vecchio id: si ricostruisce (raro)
  if (k) putMin(FMX.fm, k, i);
};
// stemma di una squadra gia' creata (al posto di `t.crest = c`)
export const setTeamCrest = (t, c) => {
  const old = t.crest;
  t.crest = c;
  const i = FMX ? FMX.pos.get(t) : undefined;
  if (i === undefined) return;
  if (old) { FMX = null; return; }
  if (c) crestKeys(String(c), []).forEach((x) => putMin(FMX.cr, x, i));
};
// squadra dall'id FotMob (quello noto o quello dello stemma teamlogo/<id>.png): l'abbinamento piu' sicuro tra le fonti
export const teamByFm = (fid) => {
  if (!fid) return null;
  const k = String(fid);
  if (/^\d+$/.test(k)) {
    indexTeams();
    const i = FMX.fm.get(k);
    if (i !== undefined) return TEAMS[i];
    const j = FMX.cr.get(k);
    return j !== undefined ? TEAMS[j] : null;
  }
  // id non numerico (mai visto nei dati): ricerca completa come sempre
  const re = new RegExp(`teamlogo/${k}\\.png`);
  return TEAMS.find((t) => String(t.fmId || '') === k) || TEAMS.find((t) => re.test(String(t.crest || ''))) || null;
};
export const teamIdOf = (name) => slug(name);

const shade = (hex, k) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#1B2C4E';
  const n = parseInt(m[1], 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

const shortOf = (name) => {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, '').split(' ').filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
};

// colori troppo scuri non si vedono sul fondo nero: li schiarisco mantenendo il tono
const lum = (hex) => {
  const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16) || 0;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
const lift = (hex) => {
  let h = hex;
  for (let i = 0; i < 4 && lum(h) < 0.2; i++) {
    const n = parseInt(h.replace('#', '').slice(0, 6), 16);
    const mix = (c) => Math.round(c + (255 - c) * 0.18);
    h = `#${((1 << 24) | (mix((n >> 16) & 255) << 16) | (mix((n >> 8) & 255) << 8) | mix(n & 255)).toString(16).slice(1)}`;
  }
  return h;
};
// colori sociali scelti a mano dove quello automatico non rende bene
const TEAM_COL = { genoa: '#D4202F' };

// id FotMob dallo stemma (…/teamlogo/1234.png): serve per trovare il colore dominante dello stemma in arch/colors.json
const fmIdOf = (crest) => { const m = /teamlogo\/(\d+)\.png/.exec(String(crest || '')); return m ? m[1] : null; };
const crestColor = (fmId, crest) => { const k = fmId || fmIdOf(crest); const c = k && RAW.colors && RAW.colors[String(k)]; return c || null; };
// secondo colore dello stemma (colori2.py): bianco/nero o la seconda zona di colore ben diversa dal primo
const crestSecond = (fmId, crest) => { const k = fmId || fmIdOf(crest); const c = k && RAW.colors2 && RAW.colors2[String(k)]; return c || null; };

export function ensureTeam(name, leagueId, crest, fmId, uid) {
  if (!name) return null;
  const id = uid || slug(name);
  let t = INDEX[id];
  if (!t) {
    const base0 = TEAM_COL[id] || (RAW.teams && RAW.teams.col && RAW.teams.col[name]) || crestColor(fmId, crest) || null;
    const base = base0 ? lift(base0) : null;
    const short = shortOf(name);
    const fx = fixedColors(name);
    t = { id, name, short, initials: short.slice(0, 3), leagueId: leagueId || null, crest: crest || null, photo: null, colors: fx || [base || '#2C3E66', (base && crestSecond(fmId, crest)) || shade(base || '#2C3E66', 0.55)], fixedCol: !!fx };
    INDEX[id] = t;
    if (!BY_NAME[name]) BY_NAME[name] = t;
    TEAMS.push(t);
  } else {
    if (crest && !t.crest) setTeamCrest(t, crest);
    if (leagueId && !t.leagueId) t.leagueId = leagueId;
    // squadra creata prima di conoscere lo stemma: se ha ancora il blu neutro prende il colore dello stemma
    if (!t.fixedCol && t.colors && t.colors[0] === '#2C3E66') {
      const cc = crestColor(fmId, crest || t.crest);
      if (cc) { const b = lift(cc); t.colors = [b, crestSecond(fmId, crest || t.crest) || shade(b, 0.55)]; }
    }
  }
  return t;
}

const add = (leagueId, team) => {
  if (!team) return;
  const list = (TEAMS_BY_LEAGUE[leagueId] = TEAMS_BY_LEAGUE[leagueId] || []);
  if (!list.includes(team)) list.push(team);
};

export function buildTeams() {
  const P = RAW.partite || {};
  const D = (RAW.data && RAW.data.leagues) || {};

  // 1) campionati nazionali: l'elenco delle squadre viene dalla classifica
  TOP5.forEach((lg) => {
    const tab = P.tab && P.tab[lg] && P.tab[lg].tot;
    (tab || []).forEach((row) => add(lg, ensureTeam(row[0], lg, row[1])));
  });
  // stemmi da data.json (tutti i campionati)
  Object.entries(D).forEach(([lg, L]) => {
    Object.keys(L.teams || {}).forEach((name) => {
      const crest = L.logos && L.logos[name];
      const isCup = lg === 'champions-league' || lg === 'europa-league';
      const t = ensureTeam(name, isCup ? null : lg, crest);
      if (isCup) add(lg, t);
      else if (!TOP5.includes(lg)) add(lg, t);
      else add(lg, t);
    });
  });
  // 2) squadre che compaiono solo nelle partite o nell'indice
  (P.matches || []).forEach((m) => {
    ensureTeam(m.h, m.lg, m.hl);
    ensureTeam(m.a, m.lg, m.al);
  });
  ((RAW.indice && RAW.indice.m) || []).forEach((m) => {
    const t1 = ensureTeam(m[3], m[1]);
    const t2 = ensureTeam(m[4], m[1]);
    if (m[1] === 'champions-league' || m[1] === 'europa-league') {
      add(m[1], t1);
      add(m[1], t2);
    }
  });
  // stemmi dalla pagina squadre
  const SQ = (RAW.squadre && RAW.squadre.lg) || {};
  Object.values(SQ).forEach((lgTeams) => Object.entries(lgTeams).forEach(([n, v]) => ensureTeam(n, null, v.l)));

  // le squadre di Champions/Europa League ereditano il campionato nazionale
  TEAMS.forEach((t) => {
    if (!t.leagueId) {
      const lg = LEAGUES.find((l) => TEAMS_BY_LEAGUE[l.id] && TEAMS_BY_LEAGUE[l.id].includes(t));
      t.leagueId = lg ? lg.id : null;
    }
  });
  Object.values(TEAMS_BY_LEAGUE).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
}
