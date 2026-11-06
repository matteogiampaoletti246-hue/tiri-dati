// Motore di calcolo del Calcolatore di Affidabilità.
// Modulo puro, indipendente dalla UI: formule, pesi e soglie non vanno modificati.
import { comma } from './format';

/* ── Input testuali (virgola come separatore decimale) ──────────────── */
export const sanitizeNum = (raw, allowDash = false) => {
  const allowed = allowDash ? /[^0-9,.\-]/g : /[^0-9,.]/g;
  let s = String(raw ?? '')
    .replace(allowed, '')
    .replace(/\./g, ',');
  const parts = s.split(',');
  if (parts.length > 2) s = `${parts[0]},${parts.slice(1).join('')}`;
  if (allowDash) s = s.replace(/-{2,}/g, '-');
  return s;
};

export const parseNum = (text) => {
  if (text === null || text === undefined) return null;
  const s = String(text).trim();
  if (!s) return null;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export const parseDash = (text) =>
  String(text ?? '')
    .split('-')
    .map((part) => parseNum(part))
    .filter((v) => v !== null);

export const fmtLine = (line) => (line === null || line === undefined ? '—' : comma(line, Number.isInteger(line) ? 0 : 1));
export const fmtPct = (v) => (v === null || v === undefined ? '—' : `${comma(v * 100, 1)}%`);

/* ── Peso della linea (tiri e falli) ──────────────────────────────────
   Piccolo aggiustamento in punti di probabilita' sul risultato finale, per le Over: 0,5 un po' agevolata, 1,5 neutra, 2,5 un po' penalizzata, 3,5 piu' penalizzata.
   Per le Under il segno si inverte. Calcolo interno, non si mostra. */
export const LINE_ADJ = { 0.5: 0.02, 1.5: 0, 2.5: -0.03, 3.5: -0.06 };
export const lineAdjust = (line, lineType) => {
  const a = LINE_ADJ[line] ?? 0;
  return lineType === 'under' ? -a : a;
};
const withLine = (p, line, lineType) => (p === null ? null : Math.min(1, Math.max(0, p + lineAdjust(line, lineType))));

/* ── Poisson ───────────────────────────────────────────────────────── */
const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600];

const factorial = (k) => {
  if (k < FACT.length) return FACT[k];
  let out = FACT[FACT.length - 1];
  for (let i = FACT.length; i <= k; i++) out *= i;
  return out;
};

export const poissonPMF = (k, lambda) => {
  if (k < 0 || lambda === null || lambda === undefined) return 0;
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
};

export const poissonCDF = (k, lambda) => {
  if (k < 0 || lambda === null || lambda === undefined) return 0;
  let sum = 0;
  for (let i = 0; i <= k; i++) sum += poissonPMF(i, lambda);
  return sum;
};

/* ── Tassi a 90' ───────────────────────────────────────────────────── */
export const seasonRate90 = (entries = []) => {
  let shots = 0;
  let minutes = 0;
  entries.forEach(({ shots: s = 0, minutes: m = 0 }) => {
    if (m > 0) {
      shots += s;
      minutes += m;
    }
  });
  return minutes > 0 ? (shots / minutes) * 90 : null;
};

export const last5Rate90 = (shots = [], minutes = []) => {
  // come nell'app originale: massimo 5 partite; senza minuti si contano 90 a partita
  let sh = shots.slice(0, 5);
  let mi = minutes.slice(0, 5);
  if (!sh.length) return null;
  if (!mi.length) mi = sh.map(() => 90);
  if (mi.length !== sh.length) return null;
  const total = mi.reduce((a, b) => a + b, 0);
  if (!(total > 0)) return null;
  return (sh.reduce((a, b) => a + b, 0) / total) * 90;
};

export const mixRate90 = (season, last5) => {
  if (last5 === null || last5 === undefined) return season;
  if (season === null || season === undefined) return last5;
  return (season + last5) / 2;
};

/* ── Opzioni e fattori ─────────────────────────────────────────────── */
export const SEDE_PLAYER = { casa: 1.06, trasferta: 0.94, neutro: 1 };
export const SEDE_TEAM = { casa: 1.12, trasferta: 0.88, neutro: 1 };

export const SEDE_OPTIONS = [
  { value: 'casa', label: 'Casa' },
  { value: 'neutro', label: 'Nessun effetto' },
  { value: 'trasferta', label: 'Trasferta' },
];
export const LINE_OPTIONS = [
  { value: 'over', label: 'Over' },
  { value: 'under', label: 'Under' },
];
export const SHOTS_OPTIONS = [
  { value: 'totali', label: 'Totali' },
  { value: 'inPorta', label: 'In porta' },
];
export const COMPETITION_OPTIONS = [
  { value: 'campionato', label: 'Campionato' },
  { value: 'coppa', label: 'Coppa europea' },
];
// con un giocatore convocato in una nazionale di Nations League compare anche la sua competizione
export const NATIONS_OPTION = { value: 'nations', label: 'Nations League' };
export const SEASON_COMPETITIONS = [
  { key: 'campionato', label: 'Campionato' },
  { key: 'coppa', label: 'Coppa europea' },
  { key: 'nations', label: 'Nations League' },
  { key: 'qualificazioni', label: 'Qualificazioni Mondiali' },
];
export const HIT_OPTIONS = [
  { value: '0', label: '0/5' },
  { value: '0.2', label: '1/5' },
  { value: '0.4', label: '2/5' },
  { value: '0.6', label: '3/5' },
  { value: '0.8', label: '4/5' },
  { value: '0.9', label: '4/5+' },
  { value: '1', label: '5/5' },
];

const strengthAdjusted = (ratio, strength) => (strength !== null && strength !== undefined && strength < 1 ? 1 + (ratio - 1) * strength : ratio);

export const oppFactorOf = (conceded, leagueAverage, strength) => {
  if (conceded === null || conceded === undefined || !leagueAverage) return null;
  return Math.pow(strengthAdjusted(conceded / leagueAverage, strength), 0.85);
};

export const creationFactorOf = (teamShots, leagueAverageFor, strength) => {
  if (teamShots === null || teamShots === undefined || !leagueAverageFor) return null;
  return Math.pow(strengthAdjusted(teamShots / leagueAverageFor, strength), 0.35);
};

export const probModel = (lambda, line, lineType) => {
  if (lambda === null || lambda === undefined || line === null || line === undefined) return null;
  const threshold = Math.floor(line);
  return lineType === 'under' ? poissonCDF(threshold, lambda) : 1 - poissonCDF(threshold, lambda);
};

export const teamLambda = (teamFor, teamOpp, sede) => {
  if (teamFor === null || teamFor === undefined || teamOpp === null || teamOpp === undefined) return null;
  return ((teamFor + teamOpp) / 2) * (SEDE_TEAM[sede] ?? 1);
};

// Colore del voto di affidabilità: <4 rosso, 4–5,99 rosso chiaro, 6–7,49 giallo, 7,5–8,49 verde chiaro, 8,5–8,99 verde scuro, ≥9 azzurro
export const SCORE_COLORS = ['#E5484D', '#F2866B', '#E8B923', '#7CCB5A', '#1FA45B', '#38BDF8'];
export const scoreBand = (v) => (v < 4 ? 0 : v < 6 ? 1 : v < 7.5 ? 2 : v < 8.5 ? 3 : v < 9 ? 4 : 5);
export const scoreColor = (v) => (v === null || v === undefined || Number.isNaN(v) ? 'var(--ink-3)' : SCORE_COLORS[scoreBand(v)]);

// Colore continuo lungo la stessa scala (usato mentre il numero scorre da un voto all'altro)
const _hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const _mix = (a, b, t) => { const x = _hex(a); const y = _hex(b); return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`; };
const _ST = [[0, 0], [3.5, 0], [4.5, 1], [5.5, 1], [6.5, 2], [7.2, 2], [7.8, 3], [8.3, 3], [8.7, 4], [8.9, 4], [9.1, 5], [10, 5]];
export const scoreColorSmooth = (v) => {
  if (v === null || v === undefined || Number.isNaN(v)) return 'var(--ink-3)';
  for (let i = 1; i < _ST.length; i += 1) {
    if (v <= _ST[i][0]) { const a = _ST[i - 1]; const b = _ST[i]; return _mix(SCORE_COLORS[a[1]], SCORE_COLORS[b[1]], (v - a[0]) / (b[0] - a[0] || 1)); }
  }
  return SCORE_COLORS[5];
};

/* ── Affidabilità, quota, valore, stake ────────────────────────────── */
export const reliability = (score) => {
  if (score === null || score === undefined) return { label: '—', tone: 'none' };
  if (score >= 8) return { label: 'Affidabilità molto alta', tone: 'high' };
  if (score >= 6.5) return { label: 'Affidabilità alta', tone: 'good' };
  if (score >= 5) return { label: 'Affidabilità media', tone: 'mid' };
  if (score >= 3) return { label: 'Affidabilità bassa', tone: 'low' };
  return { label: 'Affidabilità molto bassa', tone: 'low' };
};

const QUOTA_ANCHORS = [
  [1.01, 1.0],
  [1.59, 4.4],
  [1.6, 4.5],
  [1.69, 5.9],
  [1.7, 6.0],
  [1.85, 7.5],
  [1.86, 7.6],
  [1.95, 8.9],
  [1.96, 9.0],
  [2.5, 10.0],
];

export const quotaValue = (odds) => {
  if (odds === null || odds === undefined) return null;
  if (odds <= QUOTA_ANCHORS[0][0]) return QUOTA_ANCHORS[0][1];
  for (let i = 1; i < QUOTA_ANCHORS.length; i++) {
    const [x1, y1] = QUOTA_ANCHORS[i - 1];
    const [x2, y2] = QUOTA_ANCHORS[i];
    if (odds <= x2) return y1 + ((odds - x1) / (x2 - x1)) * (y2 - y1);
  }
  return QUOTA_ANCHORS[QUOTA_ANCHORS.length - 1][1];
};

export const quotaTier = (odds) => {
  if (odds === null || odds === undefined) return { label: '—', value: null };
  const label = odds < 1.6 ? 'Molto bassa' : odds < 1.7 ? 'Bassa' : odds < 1.86 ? 'Media' : odds < 1.96 ? 'Alta' : 'Molto alta';
  return { label, value: quotaValue(odds) };
};

export const comboScore = (score, tierValue) => {
  if (score === null || score === undefined || tierValue === null || tierValue === undefined) return { value: null, label: '—' };
  const value = score * 0.7 + tierValue * 0.3;
  const label = value >= 8 ? 'Molto alto' : value >= 6.5 ? 'Alto' : value >= 5 ? 'Medio' : value >= 3 ? 'Basso' : 'Molto basso';
  return { value, label };
};

export const valueNoteOf = (probFinal, odds) => {
  if (probFinal === null || probFinal === undefined || odds === null || odds === undefined) {
    return { text: 'Inserisci quota e statistiche', tone: 'neutral' };
  }
  const diff = (probFinal - 1 / odds) * 100;
  if (diff > 3) return { text: 'La quota sembra generosa', tone: 'good' };
  if (diff < -3) return { text: 'La quota sembra bassa per il rischio stimato', tone: 'bad' };
  return { text: "Quota in linea con l'affidabilità stimata", tone: 'neutral' };
};

export const baseStake = (v) => {
  const x = Math.max(v, 8) - 8;
  return x <= 1 ? 1 + 0.25 * x : Math.min(2, 1.25 + 0.5 * (x - 1) + 0.25 * (x - 1) ** 2);
};

export const stakeCalc = (score, odds) => {
  if (score === null || score === undefined) return { stake: null, base: null, note: 'Dati insufficienti' };
  const v = Math.round(score * 100) / 100;
  const base = baseStake(v);
  if (odds === null || odds === undefined) return { stake: null, base, note: 'Inserisci la quota' };
  if (odds > 2.45) {
    if (v <= 7.7) return { stake: null, base, note: 'Non di valore' };
    const t = Math.max(0, Math.min(1, (v - 7.7) / 1));
    return { stake: Math.max(0.75, 0.75 + (base - 0.75) * t), base, note: 'Valore' };
  }
  if (v < 8) return { stake: null, base, note: 'Non di valore' };
  if (odds < 1.6 && v < 8.2) return { stake: null, base, note: 'Non di valore' };
  if (odds < 1.6) return { stake: Math.max(0.75, (base * odds) / 1.6), base, note: 'Valore' };
  return { stake: base, base, note: 'Valore' };
};

export const lineHintText = (lambda, line) => {
  if (lambda === null || lambda === undefined || line === null || line === undefined) {
    return 'Inserisci le statistiche per stimare la difficoltà della linea';
  }
  const d = line - lambda;
  const label = d >= 2 ? 'Linea molto impegnativa' : d >= 1 ? 'Linea impegnativa' : d >= -0.5 ? 'Linea in media' : 'Linea alla portata';
  return `${label} · atteso ${comma(lambda, 2)}`;
};

// difficolta' della linea sui falli (scala propria: i falli sono meno dei tiri). Con lambda: linea meno atteso; senza: dalla sola linea (0,5 molto facile, 1,5 medio, 2,5 difficile)
export const foulLineHint = (lambda, line) => {
  if (line === null || line === undefined) return 'Scegli la linea per stimare la difficoltà';
  const d = lambda === null || lambda === undefined ? line - 1.1 : line - lambda;
  const label = d < -0.5 ? 'molto facile' : d < 0 ? 'facile' : d < 0.75 ? 'media' : d < 1.5 ? 'difficile' : 'molto difficile';
  return `Linea ${label}${lambda === null || lambda === undefined ? '' : ` · atteso ${comma(lambda, 2)}`}`;
};

/* ── Peso di modello (media tiri/falli del giocatore) e hit rate nel risultato finale ──────────
   Le formule restano tutte qui. Per tornare a quella vecchia basta cambiare FORMULA_ATTIVA in 'v1'
   (lo stesso vale per tiri, tiri in porta e falli, e quindi anche per Migliori Giocatori).
   v1 = formula originale (fino al 4 novembre 2026): modello 60% + hit rate 40%.
   v2 = formula attuale: meno peso all'hit rate, piu' alla media del giocatore (modello 70% + hit rate 30%). */
export const FORMULE = {
  v1: { modello: 0.6, hitRate: 0.4 },
  v2: { modello: 0.7, hitRate: 0.3 },
};
export const FORMULA_ATTIVA = 'v2';
const probAndHit = (prob, hitRate) => {
  if (prob === null) return null;
  if (hitRate === null) return prob;
  const w = FORMULE[FORMULA_ATTIVA];
  return prob * w.modello + hitRate * w.hitRate;
};

/* ── Risultato completo: giocatore ─────────────────────────────────── */
export function computePlayerResult({
  season = [],
  last5 = { shots: [], minutes: [] },
  line = null,
  lineType = 'over',
  odds = null,
  sede = 'neutro',
  hitRate = null,
  hitLabel = null,
  teamShots = null,
  teamAvgFor = null,
  teamStrength = null,
  oppConceded = null,
  oppAvg = null,
  oppStrength = null,
} = {}) {
  const rateSeason = seasonRate90(season);
  const rateLast5 = last5Rate90(last5.shots, last5.minutes);
  const rate90 = mixRate90(rateSeason, rateLast5);

  const oppFactor = oppFactorOf(oppConceded, oppAvg, oppStrength);
  const creationFactor = creationFactorOf(teamShots, teamAvgFor, teamStrength);
  const sedeFactor = SEDE_PLAYER[sede] ?? 1;

  const lambda = rate90 !== null && oppFactor !== null && creationFactor !== null ? rate90 * oppFactor * creationFactor * sedeFactor : null;
  const prob = probModel(lambda, line, lineType);
  const probFinal = withLine(probAndHit(prob, hitRate), line, lineType);
  const score = probFinal === null ? null : probFinal * 10;
  const tier = quotaTier(odds);
  const stake = stakeCalc(score, odds);

  return {
    kind: 'player',
    rateSeason,
    rateLast5,
    rate90,
    oppFactor,
    creationFactor,
    sedeFactor,
    lambda,
    line,
    lineType,
    probModel: prob,
    probFinal,
    score,
    reliability: reliability(score),
    impliedProb: odds ? 1 / odds : null,
    tier,
    combo: comboScore(score, tier.value),
    note: valueNoteOf(probFinal, odds),
    stake,
    hitRate,
    hitLabel,
    ready: stake.stake !== null,
  };
}

/* ── Risultato completo: media tiri squadra ────────────────────────── */
// Valore squadra corretto per la forza del campionato (campionati minori pesano meno).
const adjForStrength = (v, avg, st) => (v > 0 && st !== null && st !== undefined && st < 1 && avg > 0 ? avg + (v - avg) * st : v);

export function computeTeamResult({ teamFor: rawFor = null, teamOpp: rawOpp = null, forAvg = null, forStrength = null, oppAvg = null, oppStrength = null, sede = 'neutro', line = null, lineType = 'over', odds = null } = {}) {
  const teamFor = rawFor === null ? null : adjForStrength(rawFor, forAvg, forStrength);
  const teamOpp = rawOpp === null ? null : adjForStrength(rawOpp, oppAvg, oppStrength);
  const lambda = teamLambda(teamFor, teamOpp, sede);
  const prob = probModel(lambda, line, lineType);
  const score = prob === null ? null : prob * 10;
  const tier = quotaTier(odds);
  const stake = stakeCalc(score, odds);

  return {
    kind: 'team',
    lambda,
    line,
    lineType,
    probModel: prob,
    probFinal: prob,
    score,
    reliability: reliability(score),
    impliedProb: odds ? 1 / odds : null,
    tier,
    combo: comboScore(score, tier.value),
    note: valueNoteOf(prob, odds),
    stake,
    hitRate: null,
    hitLabel: null,
    ready: stake.stake !== null,
  };
}

/* ── Falli (commessi / subiti) ─────────────────────────────────────────
   Stesso schema dei tiri (tasso a 90' mescolato, Poisson, hit rate col peso di FORMULE[FORMULA_ATTIVA]) ma con fattori moltiplicativi a gerarchia:
   1) giocatore (con hit rate), 2) duello avversario (media dei 3 scelti al massimo), 3) squadra avversaria, 4) squadra del giocatore.
   Casa/Trasferta e handicap dei campionati minori non hanno effetto sui falli. I tiri non usano nulla di questo. */
export const FOUL_EXP = { duel: 0.5, opp: 0.35, own: 0.15, oppSolo: 0.6, ownSolo: 0.2 };
const ratioPow = (v, avg, e) => (v === null || v === undefined || !avg || !(v > 0) ? null : Math.pow(v / avg, e));
export function computeFoulsResult({
  season = [], last5 = { shots: [], minutes: [] }, line = null, lineType = 'over', odds = null, hitRate = null, hitLabel = null,
  teamVal = null, teamAvg = null, oppVal = null, oppAvg = null, duelAvg = null, duelLeagueAvg = null,
} = {}) {
  const rateSeason = seasonRate90(season);
  const rateLast5 = last5Rate90(last5.shots, last5.minutes);
  const rate90 = mixRate90(rateSeason, rateLast5);
  const hasDuel = duelAvg !== null && duelAvg !== undefined && duelLeagueAvg > 0;
  const duelFactor = hasDuel ? ratioPow(Math.max(duelAvg, 0.05), duelLeagueAvg, FOUL_EXP.duel) : null;
  const oppFactor = ratioPow(oppVal, oppAvg, hasDuel ? FOUL_EXP.opp : FOUL_EXP.oppSolo);
  const creationFactor = ratioPow(teamVal, teamAvg, hasDuel ? FOUL_EXP.own : FOUL_EXP.ownSolo);
  const lambda = rate90 !== null && oppFactor !== null && creationFactor !== null ? rate90 * oppFactor * creationFactor * (duelFactor ?? 1) : null;
  const prob = probModel(lambda, line, lineType);
  const probFinal = withLine(probAndHit(prob, hitRate), line, lineType);
  const score = probFinal === null ? null : probFinal * 10;
  const tier = quotaTier(odds);
  const stake = stakeCalc(score, odds);
  return {
    kind: 'player', rateSeason, rateLast5, rate90, oppFactor, creationFactor, duelFactor, sedeFactor: 1, lambda, line, lineType,
    probModel: prob, probFinal, score, reliability: reliability(score), impliedProb: odds ? 1 / odds : null, tier,
    combo: comboScore(score, tier.value), note: valueNoteOf(probFinal, odds), stake, hitRate, hitLabel, ready: stake.stake !== null,
  };
}
