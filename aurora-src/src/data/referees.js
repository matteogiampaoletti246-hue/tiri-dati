// Arbitri da arbitri.json (medie a partita) con foto (refphoto.json) e nazionalità (refcc.json).
import { RAW } from './load';
import { norm, slug } from './util';

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

export const findRefereeByName = (name) => (name ? BY_ID[slug(name)] || REFEREES.find((r) => norm(r.name) === norm(name)) || null : null);
