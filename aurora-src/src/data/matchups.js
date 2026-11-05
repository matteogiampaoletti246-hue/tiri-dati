// Migliori matchup: classifiche calcolate dalle medie di tutte le partite del giorno (angoli.json -> days[data].tutte, aggiornato dall'Action).
// Over = somma delle medie attese delle due squadre piu' alta, Under = piu' bassa, Divario = differenza piu' grande tra le due.
import { RAW } from './load';
import { teamByName } from './teams';
import { lruGet, lruSet } from '@/lib/lru';

// f = campi [casa, trasferta]; g = partite usate; modes = tendina di destra; periods = Totale / 1T (solo cartellini e arbitri)
export const MATCHUP_TYPES = [
  { key: 'corner', label: 'Angoli', f: ['corners_home', 'corners_away'], g: 'games' },
  { key: 'cards', label: 'Cartellini', f: ['cards_home', 'cards_away'], f1: ['cards_1t_home', 'cards_1t_away'], g: 'games_k', periods: true },
  { key: 'referees', label: 'Arbitri', periods: true, referee: true },
  { key: 'shots', label: 'Tiri', f: ['tiri_home', 'tiri_away'], g: 'tiri_games' },
  { key: 'sot', label: 'Tiri in porta', f: ['sot_home', 'sot_away'], g: 'sot_games' },
  { key: 'fouls', label: 'Falli', f: ['falli_home', 'falli_away'], g: 'falli_games' },
  { key: 'offsides', label: 'Fuorigioco', f: ['off_home', 'off_away'], g: 'off_games' },
];

export const TOP = 5;
const typeOf = (key) => MATCHUP_TYPES.find((t) => t.key === key) || MATCHUP_TYPES[0];

const MODE_LABEL = { over: 'Over', under: 'Under', gap: 'Divario' };

// Voci della tendina di destra per la statistica scelta. Cartellini e arbitri: Over/Under per Totale e 1T (i cartellini anche Divario).
export function modeOptions(typeKey) {
  const t = typeOf(typeKey);
  if (t.referee) return ['over', 'under'].flatMap((m) => ['total', 'first'].map((p) => ({ key: `${m}|${p}`, label: `${MODE_LABEL[m]} ${p === 'first' ? '1T' : 'Totale'}`, mode: m, period: p })));
  if (t.periods) {
    return [...['over', 'under'].flatMap((m) => ['total', 'first'].map((p) => ({ key: `${m}|${p}`, label: `${MODE_LABEL[m]} ${p === 'first' ? '1T' : 'Totale'}`, mode: m, period: p }))),
      ...['total', 'first'].map((p) => ({ key: `gap|${p}`, label: `Divario ${p === 'first' ? '1T' : 'Totale'}`, mode: 'gap', period: p }))];
  }
  return ['over', 'under', 'gap'].map((m) => ({ key: `${m}|total`, label: MODE_LABEL[m], mode: m, period: 'total' }));
}

// Voce di partenza: Divario per le statistiche a divario, Under totale per i cartellini (come prima), Under totale per gli arbitri
export const defaultMode = (typeKey) => (typeKey === 'cards' || typeKey === 'referees' ? 'under|total' : 'gap|total');
// Cambiando statistica si tiene la voce se esiste anche per la nuova, altrimenti si riparte da quella di base
export const keepMode = (typeKey, modeKey) => (modeOptions(typeKey).some((o) => o.key === modeKey) ? modeKey : defaultMode(typeKey));

export const matchupDays = () => Object.keys((RAW.angoli && RAW.angoli.days) || {}).sort();

const r1 = (x) => Math.round(x * 10) / 10;

// righe di un giorno ordinate: per lo stesso giorno e statistica si riusano (righe gia' fatte = niente ridisegno)
const MEMO = new Map();
let MEMO_SRC = null;
export function matchupRows(dateStr, typeKey, modeKey) {
  if (MEMO_SRC !== RAW.angoli) { MEMO.clear(); MEMO_SRC = RAW.angoli; }
  const type = typeOf(typeKey);
  if (type.referee) return [];
  const [mode, period] = (modeKey || defaultMode(typeKey)).split('|');
  const ck = `${dateStr}|${typeKey}|${mode}|${period}`;
  const hit = lruGet(MEMO, ck);
  if (hit) return hit;
  const day = RAW.angoli && RAW.angoli.days && RAW.angoli.days[dateStr];
  const list = (day && day.tutte) || [];
  const f = period === 'first' && type.f1 ? type.f1 : type.f;
  const all = [];
  list.forEach((m) => {
    const a = m[f[0]];
    const b = m[f[1]];
    if (a == null || b == null) return;
    all.push({ m, a, b, sum: r1(a + b), gap: r1(Math.abs(a - b)) });
  });
  const key = mode === 'gap' ? 'gap' : 'sum';
  all.sort((x, y) => (mode === 'under' ? x[key] - y[key] : y[key] - x[key]));
  const out = all.slice(0, TOP).map(({ m, a, b, sum, gap }) => {
    const home = teamByName(m.home);
    const away = teamByName(m.away);
    const games = m[type.g] || [];
    return {
      id: m.id, type, mode, period, homeId: home ? home.id : null, awayId: away ? away.id : null, homeName: m.home, awayName: m.away,
      league: m.league, date: m.date, home: a, away: b, center: mode === 'gap' ? gap : sum, centerLabel: mode === 'gap' ? 'Divario' : 'Totale',
      playedHome: games[0], playedAway: games[1],
    };
  });
  lruSet(MEMO, ck, out, 60);
  return out;
}

// tutte le partite del giorno con le medie attese di cartellini (servono alla sezione Arbitri)
export const dayMatches = (dateStr) => {
  const day = RAW.angoli && RAW.angoli.days && RAW.angoli.days[dateStr];
  return (day && day.tutte) || [];
};
