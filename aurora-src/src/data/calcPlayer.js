// Calcolo unico dell'affidabilità di un giocatore: lo usano sia il Calcolatore sia la Home / schede giocatore.
import { teamByName } from './teams';
import { nextFixture, pickLeagueKey, prefillShots, teamShots } from './calcData';
import { HIT_OPTIONS, SEASON_COMPETITIONS, computePlayerResult, parseDash, parseNum } from '@/lib/calc';
import { teamById } from './teams';

export const emptyBlock = () => ({ leagueId: 'serie-a', id: null, totali: '', inPorta: '' });

export const initialForm = () => ({
  playerId: null,
  tipoTiri: 'totali',
  lineType: 'over',
  line: '',
  odds: '',
  sede: 'neutro',
  competizione: 'campionato',
  hitRate: '',
  shots5: '',
  minutes5: '',
  season: {
    campionato: { tiri: '', minuti: '' },
    coppa: { tiri: '', minuti: '' },
    nations: { tiri: '', minuti: '' },
    qualificazioni: { tiri: '', minuti: '' },
  },
  team: emptyBlock(),
  opp: emptyBlock(),
});

// precompila i campi dal giocatore reale (media stagionale, ultime 5, squadre, prossima partita)
export function fillFrom(f, p, fam, fx) {
  const k = fam === 'inPorta' ? 1 : 0;
  const rows = ((p.h && p.h.length >= 5 ? p.h : p.r) || []).slice(0, 5);
  const lineV = parseNum(f.line) ?? 0;
  const hit = rows.filter((x) => (f.lineType === 'under' ? (x[k] || 0) < lineV : (x[k] || 0) > lineV)).length;
  const season = { ...f.season, campionato: { tiri: '', minuti: '' }, coppa: { tiri: '', minuti: '' } };
  [['campionato', p.l], ['coppa', p.c]].forEach(([key, a]) => {
    if (a && a[0] > 0 && a[3] > 0) season[key] = { tiri: String(Math.round((a[1 + k] / a[0]) * 100) / 100), minuti: String(Math.round(a[3] / a[0])) };
  });
  const own = teamByName(p.teamName);
  const ownKey = pickLeagueKey(p.teamName, fx && fx.cup ? fx.comp : null);
  const team = { leagueId: ownKey || 'serie-a', id: own ? own.id : null, totali: '', inPorta: '' };
  if (own && ownKey) Object.assign(team, prefillShots(teamShots(own.id, ownKey), 'for'));
  let opp = f.opp;
  let sede = f.sede;
  let competizione = f.competizione;
  if (fx) {
    const o = teamByName(fx.opp);
    const oKey = pickLeagueKey(fx.opp, fx.cup ? fx.comp : null);
    opp = { leagueId: oKey || 'serie-a', id: o ? o.id : null, totali: '', inPorta: '' };
    if (o && oKey) Object.assign(opp, prefillShots(teamShots(o.id, oKey), 'against'));
    sede = fx.home ? 'casa' : 'trasferta';
    competizione = fx.cup ? 'coppa' : 'campionato';
  }
  let fixed = rows.length >= 3 ? String(hit === 0 ? '0' : [0, 0.2, 0.4, 0.6, 0.8, 1][Math.min(5, Math.round((hit / rows.length) * 5))]) : '';
  // 4/5 con l'unica partita mancata per un solo tiro dalla linea → 4/5+ (90%)
  if (rows.length === 5 && hit === 4) {
    const need = Math.floor(lineV) + 1;
    const miss = rows.find((x) => (f.lineType === 'under' ? (x[k] || 0) >= lineV : (x[k] || 0) <= lineV));
    if (miss && Math.abs((miss[k] || 0) - (f.lineType === 'under' ? need : need - 1)) === 0) fixed = '0.9';
  }
  return {
    ...f,
    playerId: p.id,
    tipoTiri: fam,
    shots5: rows.map((x) => x[k] || 0).join('-'),
    minutes5: rows.map((x) => x[2] || 0).join('-'),
    hitRate: fixed,
    season,
    team,
    opp,
    sede,
    competizione,
  };
}

// risultato del calcolatore a partire dal modulo
export function resultFromForm(form) {
  const family = form.tipoTiri;
  const teamStats = teamShots(form.team.id, form.team.leagueId);
  const oppStats = teamShots(form.opp.id, form.opp.leagueId);
  const hitRate = form.hitRate === '' ? null : parseNum(form.hitRate);
  const hitLabel = HIT_OPTIONS.find((o) => o.value === form.hitRate)?.label ?? null;
  return computePlayerResult({
    season: SEASON_COMPETITIONS.map((c) => ({
      shots: parseNum(form.season[c.key].tiri) ?? 0,
      minutes: parseNum(form.season[c.key].minuti) ?? 0,
    })),
    last5: { shots: parseDash(form.shots5), minutes: parseDash(form.minutes5) },
    line: parseNum(form.line),
    lineType: form.lineType,
    odds: parseNum(form.odds),
    sede: form.sede,
    hitRate,
    hitLabel,
    teamShots: parseNum(form.team[family]),
    teamAvgFor: teamStats ? teamStats.avg.for[family] : null,
    teamStrength: teamStats?.strength ?? null,
    oppConceded: parseNum(form.opp[family]),
    oppAvg: oppStats ? oppStats.avg.against[family] : null,
    oppStrength: oppStats?.strength ?? null,
  });
}

const MEMO = new Map();
// voto di affidabilità (stesso calcolo del Calcolatore) per un giocatore contro la sua prossima / una data partita
export function calcReliability(p, fx, line = 0.5, lineType = 'over', family = 'totali') {
  if (!p || !fx) return null;
  const key = `${p.id}|${fx.ts || fx.opp}|${line}|${lineType}|${family}`;
  if (MEMO.has(key)) return MEMO.get(key);
  const base = { ...initialForm(), line: String(line).replace('.', ','), lineType, tipoTiri: family };
  const r = resultFromForm(fillFrom(base, p, family, fx));
  const out = r.score === null || r.score === undefined ? null : { voto: r.score, lam: r.lambda, result: r };
  MEMO.set(key, out);
  return out;
}

export { nextFixture, teamById };
