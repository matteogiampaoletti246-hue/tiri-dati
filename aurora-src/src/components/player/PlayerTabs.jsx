import { BallIcon, BootIcon } from '@/components/match/EventIcons';
import InjuryIcon from '@/components/InjuryIcon';
import { injuryOf } from '@/data/injuries';
import { Link } from 'react-router-dom';
import Crest from '@/components/Crest';
import PanelTitle from '@/components/PanelTitle';
import Radar from './Radar';
import { comma } from '@/lib/format';
import { POS_IT, POS_PL, percentiles, ratingColor, dateIt, rankOf, statValue, roleAverage, standing, bandColor, bandOf, BAND_COLORS, GROUPS } from './playerCalc';
import { per90, EX_COLS } from '@/data/players';
import { nextMatchOf } from '@/data/extras';
import { NATIONS_KEYS } from '@/data/calcData';
import { playerReliability, loadPlayerFouls, TOP_STATS, isFoulStat } from '@/data/topPlayers';
import TopStatPicker from '@/components/top/TopStatPicker';
import RollNumber from '@/components/RollNumber';
import { scoreColor } from '@/lib/calc';
import { teamById } from '@/data/teams';
import { teamByName } from '@/data/teams';
import CompSelect from '@/components/CompSelect';
import { teamCompetitions } from '@/data/competitions';
import { leagueById } from '@/data/leagues';
import { MATCHES } from '@/data/matches';
import { useEffect, useState } from 'react';
import { teamGrad } from '@/lib/tint';
import CompSeasonBar from '@/components/CompSeasonBar';
import PastStats from '@/components/past/PastStats';
import { PlayerAllMatches } from '@/components/past/PastMatches';
import { useSeasonList, initSeason, useSel, useCompIn } from '@/components/past/PastBits';
import { usePlayerCareer, useArchivePct, useBioPid, resolvePid, usePlayerSeason } from '@/data/playerIndex';
import { rosePlayer } from '@/data/rose';
import useAsync from '@/hooks/useAsync';
import { currentSeason, loadPlayerStatsFor, sortSeasons } from '@/data/archive';
import { FM_ID, LID_BY_FM } from '@/data/archive';
import { RAW } from '@/data/load';
import { fixedColors } from '@/data/teamColorFix';
import FlagDot from '@/components/FlagDot';
import { carriereOf, careerByFm, countryIt, flagCode, FOOT, dateLong, ageOf, money, monthIt } from '@/data/carriere';
import { PanelSkeleton } from '@/components/PageSkeletons';

const L = { fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)' };

export function RatingPill({ r, big }) {
  if (r === null || r === undefined) return <span className="tnum text-[12px]" style={{ color: 'var(--ink-3)' }}>—</span>;
  return (
    <span
      className="tnum inline-flex items-center justify-center rounded-lg font-semibold"
      style={{ background: ratingColor(r), color: '#fff', minWidth: big ? 44 : 36, height: big ? 28 : 22, fontSize: big ? 14 : 12 }}
    >
      {comma(r, 1)}
    </span>
  );
}

function Bars({ values, color }) {
  const vs = values.slice().reverse();
  return (
    <div className="flex h-[54px] items-end gap-1.5">
      {vs.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
          <span className="tnum text-[9.5px]" style={{ color: 'var(--ink-3)' }}>{comma(v, 1)}</span>
          <span className="w-full rounded-t-md" style={{ height: `${Math.max(8, ((v - 4) / 6) * 36)}px`, background: ratingColor(v), opacity: 0.9 }} />
        </div>
      ))}
    </div>
  );
}

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

// posizione FotMob (car/) -> ruolo dell'app, per chi non ha il ruolo nei dati PitchAPI
const PS_POS = { GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF', LWB: 'DEF', RWB: 'DEF', DM: 'MID', CDM: 'MID', CM: 'MID', AM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID', LW: 'ATT', RW: 'ATT', ST: 'ATT', CF: 'ATT' };
// campi del riquadro Informazioni (Profilo e pannello giocatore da destra)
export function useBio(player) {
  const c0 = carriereOf(player.id) || {};
  const pidB = useBioPid(player);
  const rp = pidB ? rosePlayer(pidB) : null;
  const R = rp ? rp.r : null;
  // carriera per id FotMob (car/, carriere_extra.py): anagrafica di chi non e' in carriere.json (es. Dani Rodriguez, Dinamo Zagreb)
  const { data: cf } = useAsync(() => (pidB && !c0.b ? careerByFm(pidB) : Promise.resolve(null)), [pidB]);
  // senza scheda carriere (campionati minori, appena arrivati): nazionalita', eta', altezza e maglia dalla rosa FotMob
  const c = { ...(R ? { c: R[4], h: R[6], n: R[3] } : {}), ...(cf || {}), ...c0 };
  const age = ageOf(c.b) || (R && R[5]) || null;
  const cells = [
    ['Nazionalità', c.c ? <span className="inline-flex items-center gap-2"><FlagDot name={c.c} size={20} />{countryIt(c.c)}</span> : '—'],
    ['Nato il', c.b ? `${dateLong(c.b)}${age ? ` · ${age} anni` : ''}` : age ? `${age} anni` : '—'],
    ['Altezza', c.h ? `${c.h} cm` : '—'],
    ['Piede', FOOT[c.f] || '—'],
    ['Ruolo', POS_IT[player.position] || POS_IT[PS_POS[c.ps]] || (R && POS_IT[R[2]]) || '—'],
    ['Maglia', c.n || player.number || '—'],
  ];
  return { c, cells };
}

function BioCard({ player, team }) {
  const { c, cells } = useBio(player);
  return (
    <section>
      <PanelTitle>Informazioni</PanelTitle>
      <div className="panel-solid rounded-3xl px-4 py-4">
        <div className="mb-4 flex items-center gap-3">
          <Crest team={team} size={30} />
          <div className="min-w-0">
            <p className="truncate text-[14.5px]" style={{ color: 'var(--ink)' }}>{team ? team.name : player.teamName}</p>
            <p className="text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{c.ce ? `Contratto fino al ${dateLong(c.ce)}` : ' '}</p>
          </div>
        </div>
        {injuryOf(player.id) ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{ background: 'rgba(229,72,77,.12)', border: '1px solid rgba(229,72,77,.4)' }}>
            <InjuryIcon size={24} />
            <div className="min-w-0">
              <p className="text-[14px] font-bold" style={{ color: '#E5484D' }}>Infortunato</p>
              <p className="text-[12px]" style={{ color: 'var(--ink-2)' }}>{injuryOf(player.id).reason}{injuryOf(player.id).label ? ` · Rientro previsto: ${injuryOf(player.id).label}` : ''}</p>
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {cells.map(([k, v]) => (
            <div key={k}>
              <p style={L}>{k}</p>
              <p className="mt-1 text-[14px]" style={{ color: 'var(--ink)' }}>{v}</p>
            </div>
          ))}
        </div>
        {c.mv ? (
          <div className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: 'rgba(127,160,200,.1)' }}>
            <span style={L}>Valore di mercato</span>
            <span className="tnum text-[17px] font-medium" style={{ color: '#e0a528' }}>{money(c.mv)}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ---------- PROFILO ---------- */
export function ProfiloPanel({ player: player0, team, concept }) {
  const player = usePlayerSeason(player0);
  const pc0 = percentiles(player0);
  const ap = useArchivePct(player0, !pc0.some((x) => x.pct !== null));
  const pc = (ap || pc0).filter((x) => x.key !== 'foulsCommitted');
  const colors = team ? team.colors : ['#1E4BD8', '#7FB6E8'];
  const r5 = player.ratings5 || [];
  const facts = [
    ['Squadra', team ? team.name : player.teamName],
    ['Ruolo', POS_IT[player.position] || '—'],
    ['Campionato', player.leagueId ? String(player.leagueId).toUpperCase() : '—'],
    ['Presenze', player.appearances],
    ['Minuti', player.minutes],
  ];
  const season = [
    ['Presenze', player.appearances],
    ['Gol', player.goals],
    ['Assist', player.assists],
    ['Voto', player.rating ? comma(player.rating, 2) : null],
  ].filter(([, v]) => v !== null);

  if (concept === 'b') {
    return (
      <div className="flex flex-col gap-6 px-5 pb-8 pt-5">
        <div className="grid grid-cols-2 gap-3">
          {season.map(([k, v]) => (
            <div key={k} className="panel-solid rounded-2xl px-4 py-4">
              <p style={L}>{k}</p>
              <p className="tnum mt-1 text-[30px] font-light leading-none" style={{ color: 'var(--ink)' }}>{v}</p>
            </div>
          ))}
        </div>
        {r5.length ? (
          <section>
            <PanelTitle right={<span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>media {comma(avg(r5), 2)}</span>}>Forma</PanelTitle>
            <div className="panel-solid rounded-2xl px-4 py-4"><Bars values={r5} /></div>
          </section>
        ) : null}
        <section>
          <PanelTitle>Punti di forza</PanelTitle>
          <div className="flex flex-wrap gap-2">
            {pc.filter((x) => x.pct !== null).sort((a, b) => b.pct - a.pct).slice(0, 4).map((x) => (
              <span key={x.key} className="glass-pill rounded-full px-3 py-1.5 text-[12px]" style={{ color: 'var(--ink)' }}>
                {x.label} <b className="tnum" style={{ color: 'var(--accent)' }}>{x.pct}°</b>
              </span>
            ))}
          </div>
        </section>
        <section>
          <PanelTitle>Informazioni</PanelTitle>
          <div className="panel-solid rounded-2xl px-4 py-1">
            {facts.map(([k, v], i) => (
              <div key={k} className="flex items-center justify-between py-3" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
                <span className="text-[13px]" style={{ color: 'var(--ink-3)' }}>{k}</span>
                <span className="text-[13.5px]" style={{ color: 'var(--ink)' }}>{v}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (concept === 'c') {
    return (
      <div className="flex flex-col gap-6 px-5 pb-8 pt-5">
        <div className="panel-solid flex items-center gap-5 rounded-3xl px-5 py-5">
          <div className="relative flex h-[92px] w-[92px] shrink-0 items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0">
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--hair-2)" strokeWidth="7" />
              <circle cx="50" cy="50" r="44" fill="none" stroke={ratingColor(player.rating)} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${Math.max(0, Math.min(1, ((player.rating || 5) - 5) / 4)) * 276} 276`} transform="rotate(-90 50 50)" />
            </svg>
            <span className="tnum text-[26px] font-light" style={{ color: 'var(--ink)' }}>{player.rating ? comma(player.rating, 1) : '—'}</span>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            {[['Pres.', player.appearances], ['Gol', player.goals], ['Assist', player.assists]].map(([k, v]) => (
              <div key={k}>
                <p className="tnum text-[22px] font-light" style={{ color: 'var(--ink)' }}>{v}</p>
                <p style={L}>{k}</p>
              </div>
            ))}
          </div>
        </div>
        <BioCard player={player} team={team} />
        <section>
          <PanelTitle>Profilo di gioco</PanelTitle>
          <div className="panel-solid rounded-3xl px-2 py-4"><Radar items={pc} color={colors[0]} /></div>
        </section>
      </div>
    );
  }

  // A — stile FotMob
  return (
    <div className="flex flex-col gap-6 px-5 pb-8 pt-5">
      <div className="panel-solid rounded-2xl px-4 py-1">
        {facts.map(([k, v], i) => (
          <div key={k} className="flex items-center justify-between py-3" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
            <span className="text-[13px]" style={{ color: 'var(--ink-3)' }}>{k}</span>
            <span className="text-[13.5px]" style={{ color: 'var(--ink)' }}>{v}</span>
          </div>
        ))}
      </div>
      <section>
        <PanelTitle>Stagione</PanelTitle>
        <div className="panel-solid grid grid-cols-4 rounded-2xl px-2 py-4 text-center">
          {season.map(([k, v]) => (
            <div key={k}>
              <p className="tnum text-[22px] font-light" style={{ color: 'var(--ink)' }}>{v}</p>
              <p style={L}>{k}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <PanelTitle>Radar</PanelTitle>
        <div className="panel-solid rounded-2xl px-2 py-4"><Radar items={pc} color="var(--accent)" /></div>
        <p className="mt-2 text-center text-[10.5px]" style={{ color: 'var(--ink-3)' }}>Percentile per 90&apos; tra i {POS_PL[player.position] || 'giocatori'} dei campionati</p>
      </section>
    </div>
  );
}

/* ---------- PARTITE ---------- */
// ogni partita aperta dalla scheda giocatore va in Formazioni con la tendina di quel giocatore aperta
export const openPlayerState = (name, fmId) => ({ openPlayer: { name, fmId: fmId || null } });
export const pickLineups = (matchId) => { try { sessionStorage.setItem(`sl-tabk-match-${matchId}`, 'lineups'); } catch (e) { /* ignore */ } };
export function PartitePanel({ player }) {
  const car = usePlayerCareer(player);
  const fmPid = car.pid || (carriereOf(player.id) || {}).fm;
  // tutte le competizioni e stagioni in cui ha giocato (campionato e coppe insieme), un'unica lista dalla piu' recente
  const items = car.rows.filter((r) => leagueById(LID_BY_FM[r[0]])).map((r) => [r[0], r[1]]);
  const IM = {};
  ((RAW.indice && RAW.indice.m) || []).forEach((m) => { IM[m[0]] = m; });
  const recent = (player.recent || []).filter((m) => m.matchId).map((m) => ({
    key: `r-${m.matchId}`, to: `/match/${m.matchId}`, day: String(m.date || '').slice(0, 10), date: m.date, dateText: dateIt(m.date),
    league: IM[m.matchId] ? leagueById(IM[m.matchId][1]) : null, score: IM[m.matchId] && IM[m.matchId][5] != null ? `${IM[m.matchId][5]} - ${IM[m.matchId][6]}` : '',
    oppTeam: teamByName(m.opp), oppName: m.opp, minutes: m.minutes, goals: m.goals, assists: m.assists, rating: m.rating,
  }));
  if (!recent.length && !(fmPid && items.length)) return null;
  return (
    <div className="pb-8">
      <PlayerAllMatches key={fmPid || player.id} items={fmPid ? items : []} fmPid={fmPid} playerName={player.name} recent={recent} />
    </div>
  );
}

/* ---------- STATISTICHE ---------- */
const f1 = (v, d = 1) => (v === null || v === undefined || !Number.isFinite(v) ? '–' : comma(Math.round(v * 10 ** d) / 10 ** d, d));
const CARD = { backgroundColor: 'var(--panel-solid, rgba(255,255,255,.04))', border: '1px solid var(--hair-2)', borderRadius: 18 };

// Affidabilita' prossima partita: tendina a barra (concept B) con Tiri / Tiri in porta / Falli commessi / Falli subiti;
// al cambio i voti ripartono da 0 con onda di luce, colore e "pop" (transizione C). Stesso calcolo del Calcolatore e di Migliori Giocatori.
const REL_LINES = [['Over 0,5', 0.5], ['Over 1,5', 1.5], ['Over 2,5', 2.5]];
function Affidabilita({ player: club, team, comp }) {
  // Nations League: squadra, prossima partita e statistiche sono quelle della nazionale (profilo collegato al giocatore di club)
  const player = club.natView && NATIONS_KEYS.includes(comp) ? club.natView : club;
  const [stat, setStat] = useState('tiri');
  const [anim, setAnim] = useState(false);
  const [fouls, setFouls] = useState(null);
  const next = nextMatchOf(player.teamId, comp);
  const opp = next ? teamById(next.homeId === player.teamId ? next.awayId : next.homeId) : null;
  const isF = isFoulStat(stat);
  const fk = next ? `${player.id}|${next.date}|${stat}` : '';
  useEffect(() => {
    if (!isF || !next) return undefined;
    let on = true;
    loadPlayerFouls(player, next.date, REL_LINES.map((x) => x[1]), stat).then((v) => { if (on) setFouls({ k: fk, v }); });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fk, isF]);
  const vals = REL_LINES.map(([, ln], i) => {
    if (!next) return null;
    if (isF) return fouls && fouls.k === fk ? fouls.v[i] : undefined; // undefined = sta caricando
    const r = playerReliability(player, next.date, ln, true, stat === 'porta' ? 'inPorta' : 'totali');
    return r ? r.voto : null;
  });
  return (
    <section className="px-0">
      <div className="club-card rounded-2xl px-4 py-3.5" style={CARD}>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>Affidabilità prossima partita</span>
          {opp ? (
            <span className="ml-auto flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--ink-2)' }}>
              VS <Crest team={opp} size={18} /> {opp.name}
            </span>
          ) : <span className="ml-auto text-[12px]" style={{ color: 'var(--ink-3)' }}>nessuna partita</span>}
        </div>
        <div className="mb-3">
          <TopStatPicker bar options={TOP_STATS} value={stat} onChange={(k) => { setAnim(true); setStat(k); }} />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {REL_LINES.map(([k], i) => {
            const v = vals[i];
            return (
              <div key={k} className="relative overflow-hidden rounded-xl py-3 text-center" style={{ background: 'rgba(127,160,200,.1)' }}>
                {anim ? <span key={`sw-${stat}`} className="rel-sweep" style={{ animationDelay: `${i * 110}ms` }} /> : null}
                <p className="tnum text-[22px] font-semibold" style={{ color: 'var(--ink-3)' }}>
                  {typeof v === 'number'
                    ? (anim ? <RollNumber key={`${stat}-${i}`} value={v} from={0} pop dec={2} delay={i * 110} duration={700} /> : <RollNumber value={v} dec={2} duration={0} />)
                    : v === undefined ? '' : '—'}
                </p>
                <p style={L}>{k}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function useStatConcept() {
  try { return 'b'; } catch { return 'b'; }
}

function RankRow({ x }) {
  const concept = useStatConcept();
  const col = bandColor(x.r.frac);
  const w = Math.max(4, x.r.frac * 100);
  return (
    <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
      <div className="grid items-center gap-2" style={{ gridTemplateColumns: '1fr 52px 96px' }}>
        <span className="text-[12.5px]" style={{ color: 'var(--ink-2)' }}>{x.label}</span>
        <span className="tnum text-right text-[13px]" style={{ color: 'var(--ink-3)' }}>{comma(x.v, 2)}</span>
        <span className="tnum justify-self-end text-right text-[14px] font-semibold" style={concept === 'b' ? { color: col, background: `${col}26`, padding: '1px 9px', borderRadius: 999 } : { color: col }}>
          {x.r.rank}° <span className="text-[10.5px] font-normal" style={{ color: 'var(--ink-3)' }}>su {x.r.of}</span>
        </span>
      </div>
      {concept === 'c' ? (
        <div className="relative mt-2 h-[6px]">
          <div className="absolute inset-0 flex gap-[2px] overflow-hidden rounded-full">
            {BAND_COLORS.map((c, k) => <span key={c} className="h-full flex-1" style={{ background: c, opacity: k <= bandOf(x.r.frac) ? 0.95 : 0.16 }} />)}
          </div>
          <span className="absolute top-1/2 h-[12px] w-[12px] rounded-full" style={{ left: `${w}%`, transform: 'translate(-50%,-50%)', background: '#fff', border: `3px solid ${col}` }} />
        </div>
      ) : (
        <div className="mt-2 rounded-full" style={{ height: concept === 'b' ? 8 : 5, background: 'var(--hair-2)' }}>
          <div className="h-full rounded-full" style={{ width: `${w}%`, background: concept === 'b' ? `linear-gradient(90deg, ${col}88, ${col})` : col }} />
        </div>
      )}
    </div>
  );
}

function StatRow({ player, row, i }) {
  const s = statValue(player, row);
  const l = statValue(player, row, true);
  if (s === null && l === null) return null;
  const concept = useStatConcept();
  const pct = row[2] === 'pct';
  const ref = roleAverage(player, row);
  const fmt = (v) => (v === null ? '–' : pct ? `${Math.round(v)}%` : f1(v, v < 10 ? 2 : 1));
  const top = ref ? Math.max(ref.p95 || 0, ref.avg * 1.6, s || 0, 0.0001) : null;
  const frac = ref && s !== null ? standing(player, row, s) : null;
  const col = bandColor(frac);
  const barW = ref && s !== null ? Math.max(2, Math.min(100, (s / top) * 100)) : 0;
  const avgX = ref ? Math.min(100, (ref.avg / top) * 100) : 0;
  const lab = ref ? fmt(ref.avg) : '';
  const labelX = Math.min(88, Math.max(12, avgX));
  const valStyle = concept === 'b' && frac !== null
    ? { color: col, background: `${col}26`, padding: '1px 8px', borderRadius: 999 }
    : { color: frac !== null ? col : 'var(--ink)' };
  return (
    <div className="px-4 py-2.5" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
      <div className="grid items-baseline gap-2" style={{ gridTemplateColumns: '1fr 64px 52px' }}>
        <span className="text-[12.5px] leading-tight" style={{ color: 'var(--ink-2)' }}>{row[1]}</span>
        <span className="tnum justify-self-end text-right text-[14px] font-semibold" style={valStyle}>{fmt(s)}</span>
        <span className="tnum text-right text-[13px]" style={{ color: 'var(--ink-3)' }}>{fmt(l)}</span>
      </div>
      {ref && s !== null ? (
        <div className="relative" style={{ marginTop: 17, height: concept === 'b' ? 9 : 6 }}>
          {concept === 'c' ? (
            <div className="absolute inset-0 flex gap-[2px] overflow-hidden rounded-full">
              {BAND_COLORS.map((c, k) => <span key={c} className="h-full flex-1" style={{ background: c, opacity: k <= bandOf(frac) ? 0.95 : 0.16 }} />)}
            </div>
          ) : (
            <div className="absolute inset-0 rounded-full" style={{ background: 'var(--hair-2)' }}>
              <div className="h-full rounded-full" style={{ width: `${barW}%`, background: concept === 'b' ? `linear-gradient(90deg, ${col}88, ${col})` : col }} />
            </div>
          )}
          {concept === 'c' ? (
            <span className="absolute top-1/2 h-[12px] w-[12px] rounded-full" style={{ left: `${barW}%`, transform: 'translate(-50%,-50%)', background: '#fff', border: `3px solid ${col}`, boxShadow: '0 1px 4px rgba(0,0,0,.4)' }} />
          ) : null}
          <span className="absolute" style={{ left: `${avgX}%`, top: concept === 'b' ? -5 : -4, bottom: concept === 'b' ? -5 : -4, width: 0, borderLeft: concept === 'b' ? '2px dashed var(--ink)' : '2px solid var(--ink)', opacity: 0.85 }} />
          <span
            className="tnum absolute whitespace-nowrap text-[9.5px] font-bold leading-none"
            style={{ left: `${labelX}%`, top: -17, transform: 'translateX(-50%)', color: 'var(--ink-2)', ...(concept === 'b' ? { background: 'var(--hair-2)', padding: '2px 5px', borderRadius: 6, top: -20 } : {}) }}
          >
            {concept === 'c' ? '▼ ' : ''}{lab}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function Group({ title, children }) {
  return (
    <section>
      <div className="club-card overflow-hidden rounded-2xl" style={CARD}>
        <div className="grid items-end gap-2 px-4 pb-1.5 pt-3.5" style={{ gridTemplateColumns: '1fr 56px 56px' }}>
          <span className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{title}</span>
          <span className="text-right text-[9.5px] uppercase tracking-[.08em]" style={{ color: 'var(--ink-3)' }}>Stagione</span>
          <span className="text-right text-[9.5px] uppercase tracking-[.08em]" style={{ color: 'var(--ink-3)' }}>Ultime 5</span>
        </div>
        {children}
      </div>
    </section>
  );
}

// statistiche di una coppa (tiri e minuti della competizione)
function CupSummary({ p }) {
  const c = p.c || [0, 0, 0, 0];
  const g = c[0] || 0;
  const mn = c[3] || 0;
  const p90 = (v) => (mn > 0 ? comma((v * 90) / mn, 2) : '–');
  const rows = [['Partite giocate', g], ['Minuti', Math.round(mn)], ['Tiri totali', Math.round(c[1] || 0)], ['Tiri in porta', Math.round(c[2] || 0)], ["Tiri ogni 90'", p90(c[1] || 0)], ["Tiri in porta ogni 90'", p90(c[2] || 0)]];
  return (
    <section>
      <div className="club-card overflow-hidden rounded-2xl" style={CARD}>
        <div className="px-4 pb-1 pt-3.5"><span className="text-[14px] font-semibold">Statistiche della competizione</span></div>
        {g ? rows.map(([k, v], i) => (
          <div key={k} className="flex items-baseline px-4 py-2.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
            <span className="text-[12.5px]" style={{ color: 'var(--ink-2)' }}>{k}</span>
            <span className="tnum ml-auto text-[14px] font-semibold">{v}</span>
          </div>
        )) : <p className="px-4 pb-4 pt-2 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>Nessuna presenza in questa competizione</p>}
      </div>
    </section>
  );
}

// Competizione diversa dal campionato, stagione in corso: stesso aspetto delle altre stagioni
// (riquadri col colore della squadra, valori a pillola, barre con la media della competizione).
function CupCurrent({ p, fm, fmPid, team }) {
  const { data, loading } = useAsync(async () => {
    const sk = await currentSeason(fm);
    const st = sk ? await loadPlayerStatsFor(fm, sk, fmPid) : null;
    return { sk, st };
  }, [fm, fmPid]);
  if (loading && !data) return <PanelSkeleton kind="cards" />;
  if (data && data.sk && data.st && fmPid) return <PastStats kind="players" id={fmPid} fm={fm} sk={data.sk} current teamName={team && team.name} />;
  if (!(p.c && p.c[0])) return <NoData />;
  return <div className="px-5 pb-10 pt-4"><CupSummary p={p} /></div>;
}

// un solo messaggio ordinato quando la stagione scelta non ha dati (le tendine portano alle stagioni che li hanno)
export const NoData = () => <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Dati non disponibili</p>;
// statistiche della stagione in corso nei dati dell'app (top campionati): presenze o minuti, oppure una coppa con presenze
export const playerHasCurStats = (p) => !!p && ((p.appearances || 0) > 0 || (p.minutes || 0) > 0 || !!(p.c && p.c[0]));

export function StatistichePanel({ player, team }) {
  const p = player;
  const car = usePlayerCareer(p);
  // giocatore convocato in una nazionale di Nations League: la competizione c'e' sempre, come una coppa della sua squadra (prossima partita e Affidabilita')
  const natLg = p.natView ? leagueById(p.natView.leagueId) : null;
  const baseComps = (() => {
    const c = teamCompetitions(p.teamId);
    const l = p.archive && p.leagueId ? leagueById(p.leagueId) : p.domFm ? leagueById(LID_BY_FM[p.domFm]) : null;
    const b = l ? [l, ...c.filter((x) => x.id !== l.id)] : c;
    return natLg && !b.some((x) => x.id === natLg.id) ? [...b, natLg] : b;
  })();
  // tutte le competizioni in cui ha giocato (indice giocatori), oltre a quelle della squadra attuale; in tendina solo quelle con dati
  // (la prima, quella di partenza, resta sempre: senza dati mostra "Dati non disponibili")
  const hasCurApp = (p.appearances || 0) > 0 || (p.minutes || 0) > 0;
  const withData = (id, i) => i === 0 || !!(car.bySeason[id] && car.bySeason[id].length) || (baseComps.some((c) => c.id === id) && !!(p.c && p.c[0]));
  const comps = [...baseComps, ...car.order.filter((id) => !baseComps.some((c) => c.id === id)).map(leagueById).filter(Boolean)]
    .filter((c, i) => car.loading || withData(c.id, i) || (natLg && c.id === natLg.id));
  const [comp, setComp] = useSel(p.id, 'sc', comps.length ? comps[0].id : null);
  const [season, setSeason] = useSel(p.id, 'ss', () => (p.archive ? p.sk : initSeason(FM_ID[comps.length ? comps[0].id : null])));
  const fmL = FM_ID[comp];
  const fmPid = car.pid || (carriereOf(p.id) || {}).fm;
  const inBase = baseComps.some((c) => c.id === comp);
  const idxSeasons = car.bySeason[comp];
  const oldSeasons = useSeasonList(idxSeasons || car.loading ? null : fmL, null, fmPid);
  const seasons = idxSeasons ? sortSeasons(idxSeasons).filter((s) => !inBase || p.archive || s !== car.cur[fmL]) : oldSeasons;
  const noCur = !!p.archive || !inBase;
  // senza una "stagione attuale" da mostrare (archivio o competizione non attuale) si parte dall'ultima in cui ha giocato
  const seasonEff = noCur && season === 'cur' ? (seasons[0] || null) : season;
  const dom = comps.length ? comps[0].id : null;
  const rk = [['goals', 'Gol'], ['assists', 'Assist'], ['shots', 'Tiri'], ['shotsOnTarget', 'Tiri in porta'], ['xg', 'xG'], ['foulsDrawn', 'Falli subiti']]
    .map(([k, label]) => ({ k, label, r: rankOf(p, k), v: per90(p[k] || 0, p.minutes) }))
    .filter((x) => x.r);
  const exv = (k, last) => {
    const arr = last ? p.exL5 : p.exS;
    const i = EX_COLS.indexOf(k);
    return arr && i >= 0 ? arr[i] : null;
  };
  const mpp = (m, g) => (g ? Math.round(m / g) : null);
  const gen = [
    ['Partite giocate', p.appearances, p.l5g],
    ['Gol', p.goals, exv('goals', true)],
    ['Assist', p.assists, exv('assists', true)],
    ['Minuti a partita', mpp(p.minutes, p.appearances) === null ? '–' : `${mpp(p.minutes, p.appearances)}'`, mpp(p.l5min, p.l5g) === null ? '–' : `${mpp(p.l5min, p.l5g)}'`],
  ];
  const disc = [
    ['Gialli', p.yellows, p.l5y], ['Rossi', p.reds, p.l5r],
  ];
  const simple = (rows) => rows.map(([k, v, l], i) => (
    <div key={k} className="grid items-baseline gap-2 px-4 py-2.5" style={{ gridTemplateColumns: '1fr 56px 56px', borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
      <span className="text-[12.5px]" style={{ color: 'var(--ink-2)' }}>{k}</span>
      <span className="tnum text-right text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{v ?? '–'}</span>
      <span className="tnum text-right text-[13px]" style={{ color: 'var(--ink-3)' }}>{l ?? '–'}</span>
    </div>
  ));
  const isGk = p.position === 'GK';
  const mk = (rows) => rows.map((r, i) => <StatRow key={r[0] + r[2] + i} player={p} row={r} i={i} />);
  const gShots = [['total_shots', "Tiri ogni 90'", 'p90'], ['ShotsOnTarget', "Tiri in porta ogni 90'", 'p90']];
  const gDisc = [['fouls', "Falli commessi ogni 90'", 'p90', 1], ['was_fouled', "Falli subiti ogni 90'", 'p90'], ['Offsides', "Fuorigioco ogni 90'", 'p90', 1]];

  const anim = useCompIn(comp);
  return (
    <div className="-mt-1">
    <CompSeasonBar comps={comps} comp={comp} onComp={(c) => { setComp(c); setSeason('cur'); }} seasons={fmPid ? (p.archive && p.sk && comp === p.leagueId && !seasons.includes(p.sk) ? [p.sk, ...seasons] : seasons) : []} season={seasonEff || 'cur'} onSeason={setSeason} noCur={noCur} />
    {noCur && !seasonEff ? <NoData /> : seasonEff && seasonEff !== 'cur' && fmL && fmPid ? <PastStats kind="players" id={fmPid} fm={fmL} sk={seasonEff} teamName={team && team.name} /> : fmL && fmPid && car.cur[fmL] && (car.bySeason[comp] || []).includes(car.cur[fmL]) ? (
      // stagione in corso con l'archivio: stessa interfaccia di ogni altra competizione e stagione (pillole, barre); l'Affidabilita' resta sopra
      <div key={comp} className={anim}>
        <div className="flex flex-col gap-4 px-5 pt-4"><Affidabilita player={p} team={team} comp={comp} /></div>
        <PastStats kind="players" id={fmPid} fm={fmL} sk={car.cur[fmL]} current teamName={team && team.name} />
      </div>
    ) : car.loading ? null : comp === dom && !hasCurApp ? <NoData /> : (
    <div key={comp} className={anim}>
    <div className="flex flex-col gap-4 px-5 pt-4"><Affidabilita player={p} team={team} comp={comp} /></div>
    {comp !== dom ? <CupCurrent p={p} fm={fmL} fmPid={fmPid} team={team} /> : (
    <div className="flex flex-col gap-4 px-5 pb-10 pt-4">
      {comp === dom && rk.length ? (
        <section>
          <div className="club-card overflow-hidden rounded-2xl" style={CARD}>
            <div className="px-4 pb-1 pt-3.5">
              <span className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>Classifica per ruolo</span>
              <p className="mt-0.5 text-[10.5px]" style={{ color: 'var(--ink-3)' }}>Posizione tra {{ GK: 'i portieri', DEF: 'i difensori', MID: 'i centrocampisti', WNG: 'le ali', ATT: 'gli attaccanti' }[p.position] || 'i giocatori'} del suo campionato (valori ogni 90&apos;)</p>
            </div>
            {rk.map((x) => <RankRow key={x.k} x={x} />)}
          </div>
        </section>
      ) : null}
      {comp === dom ? <Group title="Generale">{simple(gen)}</Group> : null}
      {comp === dom ? <Group title="Tiri">{mk(gShots)}</Group> : null}
      {comp === dom ? <Group title="Disciplina">{simple(disc)}{mk(gDisc)}</Group> : null}
      {comp === dom ? GROUPS.filter((g) => g.title !== 'Fisico' && (g.gk ? isGk : true)).map((g) => {
        const rows = mk(g.rows).filter(Boolean);
        return rows.length ? <Group key={g.title} title={g.title}>{rows}</Group> : null;
      }) : null}
      {comp === dom ? <p className="px-1 text-[10.5px]" style={{ color: 'var(--ink-3)' }}>La lineetta con il numero è la media del campionato per quel ruolo. Colori: rosso = nella parte bassa della classifica, giallo = a metà, verde = nella parte alta.</p> : null}
    </div>
    )}
    </div>
    )}
    </div>
  );
}

/* ---------- CARRIERA ---------- */
// Periodi consecutivi nella stessa squadra = una sola pillola (intervallo e somma di presenze/gol/assist). Se tra due periodi c'e' un'altra squadra restano separati.
const sumN = (a, b) => (a == null && b == null ? null : (Number(a) || 0) + (Number(b) || 0));
export function mergeConsecutive(rows) {
  const out = [];
  rows.forEach((x) => {
    const last = out[out.length - 1];
    if (last && last.r[0] === x.r[0]) {
      const o = x.r;
      last.r = [last.r[0], o[1] && (!last.r[1] || String(o[1]) < String(last.r[1])) ? o[1] : last.r[1], last.r[2], sumN(last.r[3], o[3]), sumN(last.r[4], o[4]), sumN(last.r[5], o[5]), last.r[6], last.r[7], last.r[8]];
      last.loan = last.loan && x.loan;
      last.n += 1;
    } else out.push({ r: [...x.r], loan: x.loan, from: x.from, n: 1 });
  });
  return out;
}

// Nazionali: la bandiera e' quella del paese anche per Under (U15-U23), femminili, olimpica, B (stessa bandiera)
const natBase = (n) => { let x = String(n || '').trim(); for (let i = 0; i < 3; i++) x = x.replace(/\s*\(?\b(U-?\d{2}|Women|W|Olympic|Olympics|Amateur|B)\b\)?$/i, '').trim(); return x; };
const NatFlag = ({ name, size = 30 }) => <FlagDot name={natBase(name)} size={size} />;

function CareerRows({ rows, national }) {
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map(({ r, loan, from }, i) => {
        const t = teamByName(r[0]);
        const cols = fixedColors(r[0]) || (t && t.colors) || ['#37507a', '#5a7bb0'];
        return (
          <div key={i} className="flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{ background: teamGrad({ colors: cols }, 0x55) }}>
            {national && flagCode(natBase(r[0])) ? <NatFlag name={r[0]} /> : <Crest team={t || { name: r[0], initials: String(r[0] || '').slice(0, 2).toUpperCase(), colors: ['#37507a', '#5a7bb0'] }} size={30} />}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[14px]" style={{ color: 'var(--ink)' }}>
                <span className="truncate">{r[0]}</span>{loan ? <span className="shrink-0 rounded-full px-1.5 text-[9.5px]" style={{ color: 'var(--ink-3)', border: '1px solid var(--hair-2)' }}>PRESTITO{from ? ` · ${from}` : ''}</span> : null}
              </p>
              <p className="mt-0.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                {monthIt(r[1])}{monthIt(r[1]) ? ' – ' : ''}{r[7] ? 'oggi' : monthIt(r[2])}
              </p>
            </div>
            {r[3] != null || r[4] != null || r[5] != null ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                {[['Pres.', r[3]], ['Gol', r[4]], ['Ass.', r[5]]].map(([k, v]) => (
                  <div key={k} className="w-8">
                    <p className="tnum text-[14px]" style={{ color: 'var(--ink)' }}>{v || '0'}</p>
                    <p style={{ ...L, fontSize: 8 }}>{k}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function CarrieraPanel({ player }) {
  const c = carriereOf(player.id);
  const { data: rec } = useAsync(async () => { const pid = await resolvePid(player); return pid ? careerByFm(pid) : null; }, [player.id]);
  // la carriera completa (tutte le squadre) viene da car/ e carriere.json; quella ricostruita dalle sole stagioni di un campionato non la sostituisce
  if (rec === undefined && !(c && c.ok)) return null;
  const raw = (rec && rec.car && rec.car.length ? rec.car : (c && c.car) || []);
  const now = new Date().toISOString().slice(0, 7);
  // FotMob registra anche i "rientri" dal prestito (stesso mese, zero presenze) e il futuro: non sono periodi giocati
  const isStub = (r) => (r[3] === null || r[3] === undefined) && (r[1] === r[2] || String(r[1]) > now);
  const senior = mergeConsecutive(raw
    .map((r, i) => {
      const prev = raw[i + 1];
      const next = raw[i - 1];
      const loan = !isStub(r) && prev && next && isStub(prev) && isStub(next) && prev[0] === next[0];
      return { r, loan: !!loan, from: loan ? prev[0] : null };
    })
    .filter((x) => !isStub(x.r)));
  const plain = (list) => mergeConsecutive((list || []).filter((r) => !isStub(r)).map((r) => ({ r, loan: false, from: null })));
  const youth = plain(rec && rec.yo);
  const nat = plain(rec && rec.nt);
  if (!senior.length && !youth.length && !nat.length) return null;
  const Title = ({ children }) => <p className="mb-2 mt-6 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{children}</p>;
  return (
    <div className="px-5 pb-8 pt-5">
      {senior.length ? <CareerRows rows={senior} /> : null}
      {nat.length ? <><Title>Nazionale</Title><CareerRows rows={nat} national /></> : null}
      {youth.length ? <><Title>Giovanili</Title><CareerRows rows={youth} national /></> : null}
    </div>
  );
}
