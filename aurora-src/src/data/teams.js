// Squadre. Nome, stemma e campionato arrivano dai file dati; il colore da teams.json.
import { RAW } from './load';
import { LEAGUES, TOP5 } from './leagues';
import { slug } from './util';

export const TEAMS = [];
export const TEAMS_BY_LEAGUE = {};
const INDEX = {};
const BY_NAME = {};

export const teamById = (id) => INDEX[id] || null;
export const teamsOf = (leagueId) => TEAMS_BY_LEAGUE[leagueId] || [];
export const teamByName = (name) => BY_NAME[name] || null;
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

export function ensureTeam(name, leagueId, crest) {
  if (!name) return null;
  const id = slug(name);
  let t = INDEX[id];
  if (!t) {
    const base0 = TEAM_COL[id] || (RAW.teams && RAW.teams.col && RAW.teams.col[name]) || null;
    const base = base0 ? lift(base0) : null;
    const short = shortOf(name);
    t = { id, name, short, initials: short.slice(0, 3), leagueId: leagueId || null, crest: crest || null, photo: null, colors: [base || '#2C3E66', shade(base || '#2C3E66', 0.55)] };
    INDEX[id] = t;
    BY_NAME[name] = t;
    TEAMS.push(t);
  } else {
    if (crest && !t.crest) t.crest = crest;
    if (leagueId && !t.leagueId) t.leagueId = leagueId;
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
