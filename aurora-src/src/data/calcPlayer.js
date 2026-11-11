// Calcolo unico dell'affidabilità di un giocatore: lo usano sia il Calcolatore sia la Home / schede giocatore.
import { teamByName } from './teams';
import { NATIONS_KEYS, nextFixture, playerLeagueHcap, pickLeagueKey, prefillShots, teamCupKey, teamShots } from './calcData';
import { HIT_OPTIONS, SEASON_COMPETITIONS, computeFoulsResult, computePlayerResult, parseDash, parseNum } from '@/lib/calc';
import { teamById } from './teams';

export const emptyBlock = () => ({ leagueId: 'serie-a', id: null, totali: '', inPorta: '' });

// falli: dati a parte, cosi' i tiri non cambiano (stat: tiri | porta | fc | fs)
export const emptyFouls = () => ({
  last5: '', min5: '', hitRate: '',
  season: { campionato: { tiri: '', minuti: '' }, coppa: { tiri: '', minuti: '' }, nations: { tiri: '', minuti: '' }, qualificazioni: { tiri: '', minuti: '' } },
  team: '', opp: '', duel: [], duelManual: false, natVals: [],
});
// profilo con cui si calcola: scegliendo Nations League un giocatore di club usa quello della nazionale (squadra, partita, statistiche)
export const viewFor = (p, competizione) => (p && p.natView && competizione === 'nations' ? p.natView : p);
export const isFouls = (form) => form.stat === 'fc' || form.stat === 'fs';

export const initialForm = () => ({
  stat: 'tiri',
  f: emptyFouls(),
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
  hitN: null,
  natVals: [],
  season: {
    campionato: { tiri: '', minuti: '' },
    coppa: { tiri: '', minuti: '' },
    nations: { tiri: '', minuti: '' },
    qualificazioni: { tiri: '', minuti: '' },
  },
  team: emptyBlock(),
  opp: emptyBlock(),
});

// Partite per l'Hit Rate (regola fissa, tutte le competizioni): solo partite con ALMENO 50', dalla piu' recente; se nella stagione in
// corso sono meno di 5 si completa con la stagione passata, sempre a ritroso (`h` di profili.py, `hn` = quante). Senza 5 si usano
// quelle che ci sono e il Calcolatore lo dice ("su 3 partite"). Dati senza `hn` (vecchio formato): come prima.
export const hitRows = (p) => ((p && p.hn !== null && p.hn !== undefined ? p.h : p && p.h && p.h.length >= 5 ? p.h : p && p.r) || []).slice(0, 5);

// Hit Rate con la nazionale (regola dell'utente, 9/11/2026): scegliendo Nations League, oltre all'Hit Rate normale conta quello delle
// partite giocate in Nations League in questa stagione (almeno 50', come sempre): "2/3", "4/5"... quante ne ha giocate e in quante ha
// superato la linea. Pesa insieme all'Hit Rate normale in proporzione alle partite (5 normali + 3 con la nazionale = 8 partite); entra
// solo la percentuale, mai la media (quella e' gia' nella riga Nations League delle Medie stagione).
export function natHitOf(vals, line, lineType) {
  const v = (vals || []).filter((x) => x !== null && x !== undefined);
  if (!v.length || line === null || line === undefined) return null;
  return { hit: v.filter((x) => (lineType === 'under' ? x < line : x > line)).length, n: v.length };
}
export function mixHit(hitRate, n, nat) {
  if (!nat || !nat.n) return hitRate;
  if (hitRate === null || hitRate === undefined) return nat.n >= 3 ? nat.hit / nat.n : null; // stessa soglia dell'Hit Rate normale: sotto 3 partite niente
  const base = n > 0 ? n : 5;
  return (hitRate * base + nat.hit) / (base + nat.n);
}
const natLabel = (label, nat) => (nat ? `${label ? `${label} + ` : ''}${nat.hit}/${nat.n}` : label);

// precompila i campi dal giocatore reale (media stagionale, ultime 5, squadre, prossima partita)
export function fillFrom(f, p, fam, fx) {
  const k = fam === 'inPorta' ? 1 : 0;
  // profilo della nazionale (Nations League): hit rate e ultime 5 = ultime partite del giocatore in generale (club, tutte le competizioni),
  // non solo quelle con la nazionale; senza profilo di club restano quelle della nazionale
  const club = p.nat && p.club ? p.club : null;
  const fromClub = !!(club && hitRows(club).length);
  const rows = fromClub ? hitRows(club) : hitRows(p);
  const lineV = parseNum(f.line) ?? 0;
  const hit = rows.filter((x) => (f.lineType === 'under' ? (x[k] || 0) < lineV : (x[k] || 0) > lineV)).length;
  const season = { ...f.season, campionato: { tiri: '', minuti: '' }, coppa: { tiri: '', minuti: '' }, nations: { tiri: '', minuti: '' } };
  // Nations League: campionato e coppa europea dal profilo di club, la riga Nations League dalla nazionale
  const src = p.nat ? [['campionato', club && club.l], ['coppa', club && club.c], ['nations', p.l]] : [['campionato', p.l], ['coppa', p.c], ['nations', p.natView && p.natView.l]]; // con campionato/coppa la riga della nazionale si vede ma non pesa
  // coppa europea solo se la squadra di club gioca Champions o Europa League in questa stagione (mai altre coppe ne' stagioni passate)
  const clubP = p.nat ? club : p;
  const clubT = clubP ? teamByName(clubP.teamName) : null;
  const hasCup = !!(clubP && teamCupKey(clubP.teamName, clubT ? clubT.id : null));
  src.forEach(([key, a]) => {
    if (key === 'coppa' && !hasCup) return;
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
    competizione = NATIONS_KEYS.includes(fx.comp) ? 'nations' : fx.cup ? 'coppa' : 'campionato';
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
    hitN: rows.length,
    hcapL: clubP ? playerLeagueHcap(clubP.teamName) : 1,
    // partite con la nazionale (profilo `nat`: `h` = Nations League di questa stagione con almeno 50'); senza profilo di club sono gia' l'Hit Rate normale
    natVals: fromClub ? (p.h || []).map((x) => x[k] || 0) : [],
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
  const nat = form.competizione === 'nations' ? natHitOf(form.natVals, parseNum(form.line), form.lineType) : null;
  const hitMix = mixHit(hitRate, form.hitN, nat);
  return computePlayerResult({
    comp: form.competizione,
    season: SEASON_COMPETITIONS.map((c) => ({
      key: c.key,
      shots: (parseNum(form.season[c.key].tiri) ?? 0) * (c.key === 'campionato' && form.competizione === 'nations' ? form.hcapL || 1 : 1),
      minutes: parseNum(form.season[c.key].minuti) ?? 0,
    })),
    last5: { shots: parseDash(form.shots5), minutes: parseDash(form.minutes5) },
    line: parseNum(form.line),
    lineType: form.lineType,
    odds: parseNum(form.odds),
    sede: form.sede,
    hitRate: hitMix,
    hitLabel: hitMix === null ? hitLabel : natLabel(hitLabel, nat),
    teamShots: parseNum(form.team[family]),
    teamAvgFor: teamStats ? teamStats.avg.for[family] : null,
    teamStrength: teamStats?.strength ?? null,
    oppConceded: parseNum(form.opp[family]),
    oppAvg: oppStats ? oppStats.avg.against[family] : null,
    oppStrength: oppStats?.strength ?? null,
  });
}

// hit rate (opzione piu' vicina) dai valori delle ultime partite rispetto alla linea; stessa regola dei tiri (4/5+ se la partita mancata e' a un solo tiro/fallo dalla linea)
export function hitFromValues(vals, line, lineType) {
  const rows = (vals || []).slice(0, 5);
  if (rows.length < 3 || line === null || line === undefined) return '';
  const ok = (v) => (lineType === 'under' ? v < line : v > line);
  const hit = rows.filter(ok).length;
  let fixed = String(hit === 0 ? '0' : [0, 0.2, 0.4, 0.6, 0.8, 1][Math.min(5, Math.round((hit / rows.length) * 5))]);
  if (rows.length === 5 && hit === 4) {
    const need = Math.floor(line) + 1;
    const miss = rows.find((v) => !ok(v));
    if (miss !== undefined && miss === (lineType === 'under' ? need : need - 1)) fixed = '0.9';
  }
  return fixed;
}

// risultato dei falli: valori gia' nel modulo (precompilati dai dati, modificabili) + media dei duelli scelti
export function resultFromFouls(form, duelAvg, duelLeagueAvg, teamAvg, oppAvg) {
  const f = form.f || emptyFouls();
  const hitRate = f.hitRate === '' ? null : parseNum(f.hitRate);
  const hitLabel = HIT_OPTIONS.find((o) => o.value === f.hitRate)?.label ?? null;
  const nat = form.competizione === 'nations' ? natHitOf(f.natVals, parseNum(form.line), form.lineType) : null;
  const hitMix = mixHit(hitRate, parseDash(f.last5).slice(0, 5).length, nat);
  return computeFoulsResult({
    comp: form.competizione,
    season: SEASON_COMPETITIONS.map((c) => ({ key: c.key, shots: parseNum(f.season[c.key].tiri) ?? 0, minutes: parseNum(f.season[c.key].minuti) ?? 0 })),
    last5: { shots: parseDash(f.last5), minutes: parseDash(f.min5) },
    line: parseNum(form.line),
    lineType: form.lineType,
    odds: parseNum(form.odds),
    hitRate: hitMix,
    hitLabel: hitMix === null ? hitLabel : natLabel(hitLabel, nat),
    teamVal: parseNum(f.team),
    teamAvg,
    oppVal: parseNum(f.opp),
    oppAvg,
    duelAvg,
    duelLeagueAvg,
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
