import { adjustForStrength } from '../data/leagues';

export interface PlayerCalcInputs {
  playerName: string;
  shotType: 'total' | 'sot';
  lineType: 'over' | 'under';
  lineValue: number;
  odds: number;
  sede: 'home' | 'neutral' | 'away';
  competition: 'league' | 'cup';
  hitRate5: string;
  l5Shots: string;
  l5Mins: string;
  shotsLeague: number;
  minutesLeague: number;
  shotsCup: number;
  minutesCup: number;
  shotsNL: number;
  minutesNL: number;
  shotsWCQ: number;
  minutesWCQ: number;
  playerLeague: string;
  playerTeam: string;
  playerTeamShots: number;
  playerLeagueAvgFor: number;
  playerStrength: number;
  oppLeague: string;
  oppTeam: string;
  oppConceded: number;
  oppConcededSOT: number;
  leagueAvg: number;
  leagueAvgSOT: number;
  oppStrength: number;
}

export interface PlayerCalcOutputs {
  score: number;
  scoreFormatted: string;
  scoreLabel: string;
  scoreColor: string;
  gaugePercent: number;
  lambda: number;
  lambdaFormatted: string;
  lineFormatted: string;
  probModel: number;
  probModelFormatted: string;
  hitRateLabel: string;
  probFinal: number;
  probFinalFormatted: string;
  impliedProb: number;
  impliedProbFormatted: string;
  quotaTierLabel: string;
  quotaTierScore: number;
  comboScore: number;
  comboScoreFormatted: string;
  comboLabel: string;
  comboColor: string;
  valueNoteClass: string;
  valueNoteTitle: string;
  valueNoteSub: string;
  rate90: number;
  rate90Formatted: string;
  rate90Label: string;
  l5Info: string;
  stakeResult: StakeResult;
}

export interface TeamCalcInputs {
  shotType: 'total' | 'sot';
  sede: 'home' | 'neutral' | 'away';
  lineType: 'over' | 'under';
  lineValue: number;
  odds: number;
  teamForShots: number;
  teamForStrength: number;
  teamForAvg: number;
  teamOppShots: number;
  teamOppStrength: number;
  teamOppAvg: number;
}

export interface TeamCalcOutputs {
  score: number;
  scoreFormatted: string;
  scoreLabel: string;
  scoreColor: string;
  gaugePercent: number;
  lambda: number;
  lambdaFormatted: string;
  lineFormatted: string;
  prob: number;
  probFormatted: string;
  impliedProb: number;
  impliedProbFormatted: string;
  quotaTierLabel: string;
  quotaTierScore: number;
  comboScore: number;
  comboScoreFormatted: string;
  comboLabel: string;
  comboColor: string;
  teamForVal: string;
  teamOppVal: string;
  teamRawVal: string;
  teamSedeVal: string;
  valueNoteClass: string;
  valueNoteTitle: string;
  valueNoteSub: string;
  stakeResult: StakeResult;
}

export interface StakeResult {
  ok: boolean;
  status: 'noodds' | 'novalue' | 'ok';
  why?: string;
  kind?: 'high' | 'normal' | 'low';
  stake?: number;
  stakeFormatted: string;
  base?: number;
  detailLines?: string[];
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function poissonPMF(k: number, lambda: number): number {
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

export function poissonCDF(k: number, lambda: number): number {
  let s = 0;
  for (let i = 0; i <= k; i++) s += poissonPMF(i, lambda);
  return s;
}

const QUOTA_ANCHORS = [
  { odds: 1.01, val: 1.0, label: 'Molto bassa' },
  { odds: 1.59, val: 4.4, label: 'Molto bassa' },
  { odds: 1.60, val: 4.5, label: 'Bassa' },
  { odds: 1.69, val: 5.9, label: 'Bassa' },
  { odds: 1.70, val: 6.0, label: 'Media' },
  { odds: 1.85, val: 7.5, label: 'Media' },
  { odds: 1.86, val: 7.6, label: 'Alta' },
  { odds: 1.95, val: 8.9, label: 'Alta' },
  { odds: 1.96, val: 9.0, label: 'Molto alta' },
  { odds: 2.50, val: 10.0, label: 'Molto alta' }
];

export function quotaTier(odds: number): { label: string; val: number } | null {
  if (odds <= 0) return null;
  let label: string;
  if (odds < 1.60) label = 'Molto bassa';
  else if (odds < 1.70) label = 'Bassa';
  else if (odds < 1.86) label = 'Media';
  else if (odds < 1.96) label = 'Alta';
  else label = 'Molto alta';

  const o = clamp(odds, QUOTA_ANCHORS[0].odds, QUOTA_ANCHORS[QUOTA_ANCHORS.length - 1].odds);
  let val = QUOTA_ANCHORS[QUOTA_ANCHORS.length - 1].val;
  for (let i = 0; i < QUOTA_ANCHORS.length - 1; i++) {
    const a = QUOTA_ANCHORS[i], b = QUOTA_ANCHORS[i + 1];
    if (o >= a.odds && o <= b.odds) {
      const t = (o - a.odds) / (b.odds - a.odds);
      val = a.val + t * (b.val - a.val);
      break;
    }
  }
  return { label, val };
}

export function stakeCalc(vRaw: number, q: number): StakeResult {
  const v = Math.round(vRaw * 100) / 100;
  if (!(q > 1)) {
    return { ok: false, status: 'noodds', stakeFormatted: '–' };
  }
  const baseFn = (vv: number) => {
    const x = Math.max(vv, 8) - 8;
    return x <= 1 ? 1 + 0.25 * x : Math.min(2, 1.25 + 0.5 * (x - 1) + 0.25 * Math.pow(x - 1, 2));
  };

  if (q > 2.45) {
    if (v <= 7.70) {
      return { ok: false, status: 'novalue', why: 'Quota sopra 2,45 con voto fino a 7,70', stakeFormatted: 'Non di valore' };
    }
    const t = clamp((v - 7.70) / 1.00, 0, 1);
    const b = baseFn(v);
    const stake = Math.max(0.75, 0.75 + (b - 0.75) * t);
    return {
      ok: true,
      status: 'ok',
      kind: 'high',
      stake,
      base: b,
      stakeFormatted: stake.toFixed(2).replace('.', ',') + '%',
      detailLines: [
        `Stake base con voto ${v.toFixed(2).replace('.', ',')}: ${b.toFixed(2).replace('.', ',')}%`,
        `Percorso da 7,70 a 8,70: ${Math.round(t * 100)}%`,
        'Da 0,75% (voto 7,70) arriva allo stake base a voto 8,70.'
      ]
    };
  }

  if (v < 8.00) {
    return { ok: false, status: 'novalue', why: 'Voto sotto 8,00', stakeFormatted: 'Non di valore' };
  }

  if (q < 1.60 && v < 8.20) {
    return { ok: false, status: 'novalue', why: 'Quota sotto 1,60 con voto sotto 8,20', stakeFormatted: 'Non di valore' };
  }

  const b = baseFn(v);
  if (q < 1.60) {
    const f = q / 1.60;
    const stake = Math.max(0.75, b * f);
    return {
      ok: true,
      status: 'ok',
      kind: 'low',
      stake,
      base: b,
      stakeFormatted: stake.toFixed(2).replace('.', ',') + '%',
      detailLines: [
        `Stake base con voto ${v.toFixed(2).replace('.', ',')}: ${b.toFixed(2).replace('.', ',')}%`,
        `Correzione quota: ${q.toFixed(2).replace('.', ',')} ÷ 1,60 = ×${f.toFixed(2).replace('.', ',')}`,
        "La giocata va affiancata a un'altra per arrivare a 1,60: lo stake scende in proporzione (minimo 0,75%)."
      ]
    };
  }

  return {
    ok: true,
    status: 'ok',
    kind: 'normal',
    stake: b,
    base: b,
    stakeFormatted: b.toFixed(2).replace('.', ',') + '%',
    detailLines: [
      `${v < 9 ? 'Stake base (sotto 9 scende piano, da 1,25% a 1%):' : 'Stake base (sopra 9 sale più in fretta):'} ${b.toFixed(2).replace('.', ',')}%`,
      'Quota tra 1,60 e 2,45: nessuna correzione.'
    ]
  };
}

function splitList(str: string): string[] {
  return String(str || '').split(/[\s,;\/\-–—+]+/).filter(x => x !== '');
}

export function parseLast5(rawShots: string, rawMins: string) {
  if (!rawShots.trim()) return { ok: false as const, msg: '' };
  let sh = splitList(rawShots).map(Number);
  let mi = splitList(rawMins).map(Number);
  if (sh.some(x => !isFinite(x) || x < 0) || mi.some(x => !isFinite(x) || x < 0)) {
    return { ok: false as const, msg: 'Controlla i numeri: uso solo cifre separate da trattini.' };
  }
  let cut = false;
  if (sh.length > 5) { sh = sh.slice(0, 5); cut = true; }
  if (mi.length > 5) { mi = mi.slice(0, 5); cut = true; }
  let assumed90 = false;
  if (mi.length === 0) { mi = sh.map(() => 90); assumed90 = true; }
  if (mi.length !== sh.length) {
    return { ok: false as const, msg: `Servono tanti minuti quanti sono i tiri: ora hai ${sh.length} tiri e ${mi.length} minuti.` };
  }
  const sumS = sh.reduce((a, b) => a + b, 0);
  const sumM = mi.reduce((a, b) => a + b, 0);
  if (!(sumM > 0)) {
    return { ok: false as const, msg: 'I minuti devono essere maggiori di zero.' };
  }
  return {
    ok: true as const,
    n: sh.length,
    avgShots: sumS / sh.length,
    avgMins: sumM / mi.length,
    rate90: (sumS / sumM) * 90,
    assumed90,
    cut
  };
}

export function computePlayerReliability(inputs: PlayerCalcInputs): PlayerCalcOutputs {
  const compRows = [
    { shots: inputs.shotsLeague || 0, minutes: inputs.minutesLeague || 0 },
    { shots: inputs.shotsCup || 0, minutes: inputs.minutesCup || 0 },
    { shots: inputs.shotsNL || 0, minutes: inputs.minutesNL || 0 },
    { shots: inputs.shotsWCQ || 0, minutes: inputs.minutesWCQ || 0 }
  ];
  let totalShots = 0, totalMinutes = 0;
  compRows.forEach(r => {
    if (r.minutes > 0) {
      totalShots += r.shots;
      totalMinutes += r.minutes;
    }
  });

  const seasonRate90 = totalMinutes > 0 ? (totalShots / totalMinutes) * 90 : 0;
  const l5 = parseLast5(inputs.l5Shots, inputs.l5Mins);
  let rate90 = seasonRate90;
  if (l5.ok) {
    rate90 = seasonRate90 > 0 ? (seasonRate90 + l5.rate90) / 2 : l5.rate90;
  }

  const isSOT = inputs.shotType === 'sot';
  const baseLbl = isSOT
    ? "Tasso di tiri in porta normalizzato a 90' (combinato)"
    : "Tasso di tiri normalizzato a 90' (combinato)";
  const rate90Label = baseLbl.replace('(combinato)', l5.ok ? '(con ultime 5)' : '(combinato)');

  let l5Info = 'Facoltativo: scrivi i valori partita per partita separati da trattini. Il calcolatore fa la media e la unisce alla media stagionale.';
  if (l5.ok) {
    l5Info = `Ultime ${l5.n}: ${l5.avgShots.toFixed(1).replace('.', ',')} tiri in ${l5.avgMins.toFixed(0)} minuti a partita = ${l5.rate90.toFixed(2).replace('.', ',')} / 90'.`
      + (seasonRate90 > 0 ? ` Media con la stagione (${seasonRate90.toFixed(2).replace('.', ',')}): ${rate90.toFixed(2).replace('.', ',')} / 90'.` : '')
      + (l5.assumed90 ? ' Minuti non inseriti: conto 90 a partita.' : '')
      + (l5.cut ? ' Uso solo le prime 5 partite.' : '');
  } else if (l5.msg) {
    l5Info = l5.msg;
  }

  const oppConceded = isSOT ? (inputs.oppConcededSOT || 0) : (inputs.oppConceded || 0);
  const leagueAvg = (isSOT ? inputs.leagueAvgSOT : inputs.leagueAvg) || 1;
  let leagueRatio = oppConceded > 0 && leagueAvg > 0 ? (oppConceded / leagueAvg) : 1;
  const oppStr = inputs.oppStrength || 1;
  if (oppStr > 0 && oppStr < 1) leagueRatio = 1 + (leagueRatio - 1) * oppStr;
  const oppFactor = Math.pow(leagueRatio, 0.85);

  const playerTeamShots = inputs.playerTeamShots || 0;
  const playerLeagueAvgFor = inputs.playerLeagueAvgFor || 1;
  let teamCreationRatio = playerTeamShots > 0 && playerLeagueAvgFor > 0 ? (playerTeamShots / playerLeagueAvgFor) : 1;
  const plStr = inputs.playerStrength || 1;
  if (plStr > 0 && plStr < 1) teamCreationRatio = 1 + (teamCreationRatio - 1) * plStr;
  const teamCreationFactor = Math.pow(teamCreationRatio, 0.35);

  let sedeFactor = 1;
  if (inputs.sede === 'home') sedeFactor = 1.06;
  else if (inputs.sede === 'away') sedeFactor = 0.94;

  const lambda = rate90 * oppFactor * teamCreationFactor * sedeFactor;
  const line = inputs.lineValue || 0;
  const threshold = Math.floor(line);

  let prob = 0;
  if (lambda <= 0) {
    prob = 0;
  } else if (inputs.lineType === 'over') {
    prob = 1 - poissonCDF(threshold, lambda);
  } else {
    prob = poissonCDF(threshold, lambda);
  }
  prob = clamp(prob, 0, 1);
  const probModel = prob;

  const hitRateRaw = inputs.hitRate5;
  const hitRate = hitRateRaw === '' ? null : parseFloat(hitRateRaw);
  let probFinal = probModel;
  if (hitRate !== null) {
    probFinal = probModel * 0.6 + hitRate * 0.4;
  }
  probFinal = clamp(probFinal, 0, 1);
  const score = probFinal * 10;
  const hasData = lambda > 0;

  let label = '', color = '#EF4444';
  if (score >= 8) { label = 'Affidabilità molto alta'; color = '#10B981'; }
  else if (score >= 6.5) { label = 'Affidabilità alta'; color = '#34D399'; }
  else if (score >= 5) { label = 'Affidabilità media'; color = '#F59E0B'; }
  else if (score >= 3) { label = 'Affidabilità bassa'; color = '#F59E0B'; }
  else { label = 'Affidabilità molto bassa'; color = '#EF4444'; }

  const odds = inputs.odds || 0;
  const impliedProb = odds > 0 ? (1 / odds) : 0;
  const tier = quotaTier(odds);

  let comboScore = 0;
  let comboLabel = '';
  let comboColor = '#EF4444';
  if (tier && hasData) {
    comboScore = score * 0.7 + tier.val * 0.3;
    if (comboScore >= 8) { comboLabel = 'Molto alto'; comboColor = '#10B981'; }
    else if (comboScore >= 6.5) { comboLabel = 'Alto'; comboColor = '#34D399'; }
    else if (comboScore >= 5) { comboLabel = 'Medio'; comboColor = '#F59E0B'; }
    else if (comboScore >= 3) { comboLabel = 'Basso'; comboColor = '#F59E0B'; }
    else { comboLabel = 'Molto basso'; comboColor = '#EF4444'; }
  }

  let valueNoteClass = '';
  let valueNoteTitle = 'Inserisci quota e statistiche';
  let valueNoteSub = 'Servono per calcolare λ e confrontare la probabilità con la quota.';

  if (odds > 0 && lambda > 0) {
    const diff = (probFinal - impliedProb) * 100;
    if (diff > 3) {
      valueNoteClass = 'pos';
      valueNoteTitle = 'La quota sembra generosa';
      valueNoteSub = `Probabilità stimata dal modello ${(probFinal * 100).toFixed(1)}%, implicita dalla quota ${(impliedProb * 100).toFixed(1)}%. Il divario è a favore della giocata.`;
    } else if (diff < -3) {
      valueNoteClass = 'neg';
      valueNoteTitle = 'La quota sembra bassa per il rischio stimato';
      valueNoteSub = `Probabilità stimata dal modello ${(probFinal * 100).toFixed(1)}%, implicita dalla quota ${(impliedProb * 100).toFixed(1)}%. Il divario è contro la giocata.`;
    } else {
      valueNoteClass = 'neutral';
      valueNoteTitle = "Quota in linea con l'affidabilità stimata";
      valueNoteSub = 'Nessun divario significativo tra probabilità stimata e implicita.';
    }
  }

  const stakeResult = stakeCalc(score, odds);

  return {
    score,
    scoreFormatted: hasData ? score.toFixed(2).replace('.', ',') : '–',
    scoreLabel: hasData ? label : '',
    scoreColor: color,
    gaugePercent: hasData ? score * 10 : 0,
    lambda,
    lambdaFormatted: lambda > 0 ? lambda.toFixed(2) : '–',
    lineFormatted: (inputs.lineType === 'over' ? 'Over ' : 'Under ') + line.toFixed(1),
    probModel,
    probModelFormatted: hasData ? (probModel * 100).toFixed(1) + '%' : '–',
    hitRateLabel: hitRate !== null ? (hitRate === 0.9 ? '4/5+ (90%)' : (hitRate * 100).toFixed(0) + '%') : 'Non inserito',
    probFinal,
    probFinalFormatted: hasData ? (probFinal * 100).toFixed(1) + '%' : '–',
    impliedProb,
    impliedProbFormatted: odds > 0 ? (impliedProb * 100).toFixed(1) + '%' : '–',
    quotaTierLabel: tier ? `${tier.label} (${tier.val.toFixed(1)}/10)` : '–',
    quotaTierScore: tier ? tier.val : 0,
    comboScore,
    comboScoreFormatted: (tier && hasData) ? comboScore.toFixed(2).replace('.', ',') : '–',
    comboLabel,
    comboColor,
    valueNoteClass,
    valueNoteTitle,
    valueNoteSub,
    rate90,
    rate90Formatted: rate90 > 0 ? `${rate90.toFixed(2)} tiri / 90'` : '–',
    rate90Label,
    l5Info,
    stakeResult
  };
}

export function computeTeamForecast(inputs: TeamCalcInputs): TeamCalcOutputs {
  const teamFor = adjustForStrength(inputs.teamForShots, inputs.teamForAvg, inputs.teamForStrength);
  const teamOpp = adjustForStrength(inputs.teamOppShots, inputs.teamOppAvg, inputs.teamOppStrength);
  const raw = (teamFor + teamOpp) / 2;

  let sedeFactor = 1;
  if (inputs.sede === 'home') sedeFactor = 1.12;
  else if (inputs.sede === 'away') sedeFactor = 0.88;

  const lambda = raw * sedeFactor;
  const line = inputs.lineValue || 0;
  const threshold = Math.floor(line);

  let prob = 0;
  if (lambda <= 0) {
    prob = 0;
  } else if (inputs.lineType === 'over') {
    prob = 1 - poissonCDF(threshold, lambda);
  } else {
    prob = poissonCDF(threshold, lambda);
  }
  prob = clamp(prob, 0, 1);
  const score = prob * 10;
  const teamHasData = lambda > 0;

  let label = '', color = '#EF4444';
  if (score >= 8) { label = 'Affidabilità molto alta'; color = '#10B981'; }
  else if (score >= 6.5) { label = 'Affidabilità alta'; color = '#34D399'; }
  else if (score >= 5) { label = 'Affidabilità media'; color = '#F59E0B'; }
  else if (score >= 3) { label = 'Affidabilità bassa'; color = '#F59E0B'; }
  else { label = 'Affidabilità molto bassa'; color = '#EF4444'; }

  const odds = inputs.odds || 0;
  const impliedProb = odds > 0 ? (1 / odds) : 0;
  const tier = quotaTier(odds);

  let comboScore = 0;
  let comboLabel = '';
  let comboColor = '#EF4444';
  if (tier && teamHasData) {
    comboScore = score * 0.7 + tier.val * 0.3;
    if (comboScore >= 8) { comboLabel = 'Molto alto'; comboColor = '#10B981'; }
    else if (comboScore >= 6.5) { comboLabel = 'Alto'; comboColor = '#34D399'; }
    else if (comboScore >= 5) { comboLabel = 'Medio'; comboColor = '#F59E0B'; }
    else if (comboScore >= 3) { comboLabel = 'Basso'; comboColor = '#F59E0B'; }
    else { comboLabel = 'Molto basso'; comboColor = '#EF4444'; }
  }

  let valueNoteClass = '';
  let valueNoteTitle = 'Inserisci quota e statistiche';
  let valueNoteSub = 'Servono per confrontare la probabilità con la quota.';

  if (odds > 0 && lambda > 0) {
    const diff = (prob - impliedProb) * 100;
    if (diff > 3) {
      valueNoteClass = 'pos';
      valueNoteTitle = 'La quota sembra generosa';
      valueNoteSub = `Probabilità stimata dal modello ${(prob * 100).toFixed(1)}%, implicita dalla quota ${(impliedProb * 100).toFixed(1)}%. Il divario è a favore della giocata.`;
    } else if (diff < -3) {
      valueNoteClass = 'neg';
      valueNoteTitle = 'La quota sembra bassa per il rischio stimato';
      valueNoteSub = `Probabilità stimata dal modello ${(prob * 100).toFixed(1)}%, implicita dalla quota ${(impliedProb * 100).toFixed(1)}%. Il divario è contro la giocata.`;
    } else {
      valueNoteClass = 'neutral';
      valueNoteTitle = "Quota in linea con l'affidabilità stimata";
      valueNoteSub = 'Nessun divario significativo tra probabilità stimata e implicita.';
    }
  }

  const stakeResult = stakeCalc(score, odds);

  return {
    score,
    scoreFormatted: teamHasData ? score.toFixed(2).replace('.', ',') : '–',
    scoreLabel: teamHasData ? label : '',
    scoreColor: color,
    gaugePercent: teamHasData ? score * 10 : 0,
    lambda,
    lambdaFormatted: lambda > 0 ? lambda.toFixed(2) : '–',
    lineFormatted: (inputs.lineType === 'over' ? 'Over ' : 'Under ') + line.toFixed(1),
    prob,
    probFormatted: teamHasData ? (prob * 100).toFixed(1) + '%' : '–',
    impliedProb,
    impliedProbFormatted: odds > 0 ? (impliedProb * 100).toFixed(1) + '%' : '–',
    quotaTierLabel: tier ? `${tier.label} (${tier.val.toFixed(1)}/10)` : '–',
    quotaTierScore: tier ? tier.val : 0,
    comboScore,
    comboScoreFormatted: (tier && teamHasData) ? comboScore.toFixed(2).replace('.', ',') : '–',
    comboLabel,
    comboColor,
    teamForVal: teamFor > 0 ? teamFor.toFixed(2) : '–',
    teamOppVal: teamOpp > 0 ? teamOpp.toFixed(2) : '–',
    teamRawVal: raw > 0 ? raw.toFixed(2) : '–',
    teamSedeVal: inputs.sede === 'home' ? 'Casa ×1,12' : inputs.sede === 'away' ? 'Trasferta ×0,88' : 'Nessun effetto ×1,00',
    valueNoteClass,
    valueNoteTitle,
    valueNoteSub,
    stakeResult
  };
}
